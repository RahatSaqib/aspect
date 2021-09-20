const Boom = require('@hapi/boom')
const _ = require('lodash')
const Promise = require('bluebird')
const {
  knex,
  filterParams,
  filterDateRangeParams,
  sortPageParams,
  transact,
} = require('../db')
const { getUser } = require('../auth/service')
const {
  getJobConstraints,
  addConstraints,
  getConstraints,
} = require('../auth/constraints')
const { notificationCreated } = require('./actions')
const { alertMessageCreated } = require('../alert/actions')
const { emailMessageCreated } = require('../email/actions')
const { smsMessageCreated } = require('../sms/actions')
const { webhookMessageCreated } = require('../webhook/actions')
const {
  fileContentTypeToId,
  messageStatusToId,
  messageSeverityToId,
  notificationTypeCategoryToId,
} = require('../shared/dictionary')

const evaluationMethods = {
  issueBased: () => true, // this will be developed once we move the issue based notification to the ui
  resultBased: resultConditionsMet,
}
function resultCategoryFilters(
  queryBuilder,
  { result: results = [] },
  resultAlias
) {
  if (results.length > 0) {
    queryBuilder
      .join('Assay as a', `${resultAlias}.assayId`, 'a.id')
      .leftJoin('ResultCategoryAssay as rca', function () {
        this.on('a.id', 'rca.assayId').andOn(
          `${resultAlias}.resultCategory1`,
          'rca.resultCategoryId'
        )
      })
      .leftJoin('ResultCategory as rc1', 'rca.resultCategoryId', 'rc1.id')
      .leftJoin('ResultCategoryAssay as rca2', function () {
        this.on(`a.Id`, 'rca2.assayId').andOn(
          `${resultAlias}.resultCategory2`,
          'rca2.resultCategoryId'
        )
      })
      .leftJoin('ResultCategoryGroup as rcg', function () {
        this.on(`a.id`, 'rcg.assayId')
          .andOn(function () {
            this.on(knex.raw('rcg.resultCategory1Id IS NULL')).orOn(
              `${resultAlias}.resultCategory1`,
              'rcg.resultCategory1Id'
            )
          })
          .andOn(function () {
            this.on(knex.raw('rcg.resultCategory2Id IS NULL')).orOn(
              `${resultAlias}.resultCategory2`,
              'rcg.resultCategory2Id'
            )
          })
      })
      .leftJoin('ResultCategory as rc2', 'rca2.resultCategoryId', 'rc2.id')
    queryBuilder.where(resultBuilder =>
      _.each(results, elem => {
        resultBuilder.orWhere(whereBuilder => {
          whereBuilder.where('a.externalId', elem.assayId)
          if (
            _.find(
              elem.resultCategoryId,
              item => item.scope === 'ResultCategoryGroups'
            )
          )
            whereBuilder.whereIn(
              'rcg.externalId',
              _.map(
                _.filter(
                  elem.resultCategoryId,
                  item => item.scope === 'ResultCategoryGroups'
                ),
                obj => obj.value
              )
            )
          if (
            _.find(
              elem.resultCategoryId,
              item => item.scope === 'ResultCategories'
            )
          ) {
            const itemsToFilter = _.map(
              _.filter(
                elem.resultCategoryId,
                item => item.scope === 'ResultCategories'
              ),
              obj => obj.value
            )
            whereBuilder.andWhere(builder =>
              builder
                .whereIn('rc1.externalId', itemsToFilter)
                .orWhereIn('rc2.externalId', itemsToFilter)
            )
          }
        })
      })
    )
  }
}

function geographyFilters(
  queryBuilder,
  { areaItems, deviceLevelId },
  { device = 'd', geography = 'g' }
) {
  if (deviceLevelId === 'state') {
    const areaToFilters = _.map(areaItems, area => _.toInteger(area.value))
    queryBuilder.whereIn(`${geography}.stateId`, areaToFilters)
  }
  if (deviceLevelId === 'lga') {
    queryBuilder.whereIn(
      `${geography}.lgaId`,
      _.map(areaItems, area => _.toInteger(area.value))
    )
  }
  if (deviceLevelId === 'lab') {
    queryBuilder.whereIn(
      `${device}.siteId`,
      _.map(areaItems, area => _.toInteger(area.value))
    )
  }
}

function resultConditionsMet(queryBuilder, filterCondition, aliases) {
  const { result = 'r' } = aliases
  resultCategoryFilters(queryBuilder, filterCondition, result)
  geographyFilters(queryBuilder, filterCondition, aliases)
}

async function listNotifications(request) {
  const { query, auth } = request

  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)

  const notificationQuery = knex('NotificationType as nt')
    .innerJoin(
      'NotificationTypeCategory as ntc',
      'nt.notificationTypeCategoryId',
      'ntc.id'
    )
    .leftOuterJoin('Notification as n', 'nt.id', 'n.notificationTypeId')
    .leftJoin('MessageType as m', 'm.id', 'nt.messageTypeId')
    .leftJoin('Partner as p', 'nt.partnerId', 'p.id')
    .where(builder => {
      builder.whereNotNull('n.id').orWhere('ntc.externalId', 'resultBased')
    })
    .modify(filterParams, query, {})
    .modify(filterDateRangeParams, query, 'lastTriggeredOn')
    .modify(addConstraints, dataConstraints, { partner: 'p' })

  const getItems = notificationQuery
    .clone()
    .leftJoin('Job as j', 'nt.jobFunctionId', 'j.JobfunctionId')
    .leftJoin('Person as per', 'j.personId', 'per.id')
    .select(
      'nt.id as id',
      'nt.name',
      knex.raw('count(distinct n.issueId) as totalTriggers'),
      columnCount('alert'),
      knex.raw('COUNT(DISTINCT per.id) as contactsCount'),
      knex.raw(
        "SUBSTRING_INDEX(GROUP_CONCAT(DISTINCT per.`name`),',',5) as contacts"
      ),
      'ntc.externalId as typeCategory'
    )
    .max('n.createdOn as lastTriggeredOn')
    .groupBy('nt.name')
    .modify(sortPageParams, query, 'nt.name')
    .modify(filterParams, query, {
      notificationName: 'nt.name',
    })

  function columnCount(column) {
    return knex.raw(
      `CASE
        WHEN m.${column}TemplateId IS NULL
        THEN null
        ELSE SUM(CASE WHEN n.${column}MessageId IS NULL THEN 0 ELSE 1 END) END as ${column}Count`
    )
  }

  const getCount = knex
    .count('* as count')
    .from(getItems.clone().as('mainQuery'))
    .first()

  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  return { ok: true, total, data, length: data.length }
}

async function createNotifications(knex, action, context) {
  const now = new Date()
  const { filterCondition = null, notificationTypeCategoryId = 'issueBased' } =
    action
  const policies = await getNotificationPolicy(
    knex,
    action,
    evaluationMethods[notificationTypeCategoryId],
    filterCondition
  )
  // for each job function, find all policies with maximum constrained level,
  // since we are ordered by, max level at first position and filter all with same
  let jobFunctionId = null
  let jobFunctionLevel = null
  const { jobFunctions = [] } = filterCondition || {}
  await Promise.each(policies, async policy => {
    if (_.isNil(policy.jobFunctionId) && _.isEmpty(jobFunctions)) {
      await createNotificationIfNotCreatedAlready(
        action,
        { policy, now },
        { messageContext: context, knex }
      )
    } else {
      if (_.isEmpty(jobFunctions) && policy.jobFunctionId)
        if (policy.jobFunctionId !== jobFunctionId) {
          ;({ jobFunctionId, level: jobFunctionLevel } = policy)
        } else if (policy.level !== jobFunctionLevel) {
          // This is a lower level for this particular job function
          // continue until we get to end of list or new job function
          /* eslint-disable no-continue */
          return Promise.resolve()
        }

      const tags = await getTagsByPolicy(knex, policy)
      const people = await getPeopleToNotify(knex, policy, tags, jobFunctions)
      await sendNotificationsToPeople(knex, context, people, policy, action)
    }
  })
}

async function getTagsByPolicy(txKnex, policy) {
  const notificationTypeTagIds = policy.sendToContactsWithMatchingTags
    ? await txKnex('NotificationTypeTag')
        .where({ notificationTypeId: policy.id })
        .pluck('tagId')
    : []
  const siteTagIds =
    policy.sendToContactsWithMatchingTags && policy.siteId
      ? await txKnex('SiteTag').where({ siteId: policy.siteId }).pluck('tagId')
      : []
  const deviceTagIds =
    policy.sendToContactsWithMatchingTags && policy.deviceId
      ? await txKnex('DeviceTag')
          .where({ deviceId: policy.deviceId })
          .pluck('tagId')
      : []
  const resultTagIds =
    policy.sendToContactsWithMatchingTags && policy.resultId
      ? await txKnex('ResultTag')
          .where({ resultId: policy.resultId })
          .pluck('tagId')
      : []
  /* const personTagIds =
    jobFunctions && jobFunctions.length > 0
      ? await txKnex('PersontTag as pt')
          .join('Person as p', 'pt.personId', 'p.id')
          .join('Job as j', 'p.id', 'j.personId')
          .whereIn(
            'j.jobFunctionId',
            _.map(jobFunctions, jf => jf.jobFunctionId)
          )
          .pluck('tagId')
      : [] */
  return [
    ...notificationTypeTagIds,
    ...siteTagIds,
    ...deviceTagIds,
    ...resultTagIds,
    // ...personTagIds,
  ]
}

async function getNotificationPolicy(
  txKnex,
  action,
  extraConditionsFunction = () => true,
  extraConditions = {}
) {
  const selectColums = [
    'nt.id',
    'nt.jobFunctionId',
    'nt.level',
    'nt.sendToContactsWithMatchingTags',
    'g.countryId',
    'g.stateId',
    'g.lgaId',
    'mt.alertTemplateId',
    'mt.emailTemplateId',
    'mt.smsTemplateId',
    'mt.webhookTemplateId',
  ]
  let extraFields = []
  const aliases = { geography: 'g' }
  const records = txKnex('NotificationType as nt')
    .join(
      'NotificationTypeCategory as ntc',
      'nt.notificationTypeCategoryId',
      'ntc.id'
    )
    .join('MessageType as mt', 'nt.messageTypeId', 'mt.id')
    .modify((queryBuilder, { resultId, issueId }) => {
      if (!_.isNil(issueId)) {
        extraFields = ['i.siteId', 'i.deviceId', 'i.resultId']
        queryBuilder
          .join('Issue as i', joinBuilder =>
            // If issue is escalated past configured level, send again
            // on escalation to maximum configured level
            joinBuilder
              .on('i.issueTypeId', 'nt.issueTypeId')
              .andOn('i.partnerId', 'nt.partnerId')
              .andOn('i.level', '>=', 'nt.level')
          )
          .leftJoin('Geography as g', 'i.geographyId', 'g.id')
          .where({ 'i.id': issueId })
        aliases.issue = 'i'
      } else if (!_.isNil(resultId)) {
        extraFields = [
          'result.siteId as siteId',
          'result.deviceId as deviceId',
          'result.resultId as resultId',
        ]
        queryBuilder
          .crossJoin(
            knex('Result as r')
              .where('r.id', resultId)
              .select(
                'r.siteId',
                'r.assayId',
                'r.deviceId',
                'r.id as resultId',
                'r.resultCategory1',
                'r.resultCategory2'
              )
              .as('result')
          )
          .join('Device as d', 'result.deviceId', 'd.id')
          .leftJoin('Geography as g', 'd.geographyId', 'g.id')
          .where('ntc.externalId', 'resultBased')
        aliases.result = 'result'
        aliases.device = 'd'
      }
    }, action)
    .orderBy('nt.jobFunctionId', 'DESC')
    .orderBy('nt.level', 'DESC')
    .modify(extraConditionsFunction, extraConditions, aliases)
    .distinct(selectColums.concat(extraFields))
  return records
}

async function getPeopleToNotify(txKnex, policy, tags, jobFunctions) {
  const people = txKnex('Job as j')
    .join('JobFunction as jf', 'j.jobFunctionId', 'jf.id')
    .leftJoin('PersonTag as pt', 'j.personId', 'pt.personId')
    .modify(queryBuilder => {
      if (policy.sendToContactsWithMatchingTags) {
        queryBuilder.whereIn('pt.tagId', _.uniq(tags))
      }
      if (policy.jobFunctionId)
        queryBuilder.where('jf.id', policy.jobFunctionId)
      if (!_.isEmpty(jobFunctions)) {
        queryBuilder.where(jfBuilder => {
          _.each(jobFunctions, ({ jobFunctionId, tags = [] }) => {
            jfBuilder.orWhere(builder => {
              builder.where('jf.id', jobFunctionId)
              if (tags.length > 0) {
                builder.whereIn(
                  'pt.tagId',
                  _.uniq(_.map(tags, tag => tag.value))
                )
              }
            })
          })
        })
      }
    })
    .distinct('j.personId as id', 'j.jobFunctionId')
  return people
}

async function sendNotificationsToPeople(
  txKnex,
  context,
  people,
  policy,
  action
) {
  const now = new Date()
  // Issue notification to every person assigned, (subscriber will create as necessary)
  await Promise.all(
    people.map(async person => {
      const shouldNotifyToPerson = await shouldNotify(
        txKnex,
        action,
        person.id,
        person.jobFunctionId
      )
      if (shouldNotifyToPerson != null) {
        await createNotificationIfNotCreatedAlready(
          action,
          { personId: person.id, policy, now },
          { messageContext: context, knex: txKnex }
        )
      }
    })
  )
}

async function shouldNotify(
  txKnex,
  { issueId = null, resultId = null },
  personId,
  jobFunctionId
) {
  const aliasMapping = {
    device: 'd',
    site: 's',
    geography: 'g',
    partner: 'p',
    showUnapprovedDevices: true,
    showDecommissionedDevices: true,
  }
  // does person have job context that can see this issue/result?
  const constraints = await getJobConstraints(personId, jobFunctionId)
  const table = !_.isNil(issueId) ? 'Issue as i' : 'Result as i'
  if (!_.isNil(issueId)) aliasMapping.issue = 'i'
  else aliasMapping.result = 'i'
  const records = await txKnex(table)
    .leftJoin('Device as d', 'i.deviceId', 'd.id')
    .leftJoin('Site as s', 'i.siteId', 's.id')
    .leftJoin('Geography as g', 'i.geographyId', 'g.id')
    .leftJoin('Partner as p', 'i.partnerId', 'p.id')
    .modify(addConstraints, constraints, aliasMapping)
    .where({ 'i.id': issueId || resultId })
    .first('i.id')
  return records
}

async function createNotificationIfNotCreatedAlready(
  { issueId = null, resultId = null },
  { personId = null, policy, now = new Date() },
  { messageContext: context, knex }
) {
  context.bindActionCreators({
    notificationCreated,
    alertMessageCreated,
    emailMessageCreated,
    smsMessageCreated,
    webhookMessageCreated,
  })
  const notification = {
    issueId,
    resultId,
    notificationTypeId: policy.id,
    personId,
  }
  const existingNotification = await knex('Notification')
    .where(notification)
    .first()
  if (!existingNotification) {
    notification.createdOn = now
    const messageStatusId = await messageStatusToId('Initial')
    const sharedMessageProperties = {
      messageStatusId,
      personId,
      siteId: policy.siteId,
      deviceId: policy.deviceId,
      resultId: policy.resultId,
      createdOn: now,
      updatedOn: now,
    }
    if (personId) {
      if (policy.alertTemplateId != null) {
        const [alertMessageId] = await knex('AlertMessage').insert({
          alertTemplateId: policy.alertTemplateId,
          ...sharedMessageProperties,
        })
        notification.alertMessageId = alertMessageId
        context.alertMessageCreated(alertMessageId)
      }
    }

    if (policy.emailTemplateId != null) {
      const [emailMessageId] = await knex('EmailMessage').insert({
        emailTemplateId: policy.emailTemplateId,
        ...sharedMessageProperties,
      })
      notification.emailMessageId = emailMessageId
      context.emailMessageCreated(emailMessageId)
    }
    if (policy.smsTemplateId != null) {
      const [smsMessageId] = await knex('SmsMessage').insert({
        smsTemplateId: policy.smsTemplateId,
        ...sharedMessageProperties,
      })
      notification.smsMessageId = smsMessageId
      context.smsMessageCreated(smsMessageId)
    }

    if (policy.webhookTemplateId != null) {
      const [webhookMessageId] = await knex('WebhookMessage').insert({
        webhookTemplateId: policy.webhookTemplateId,
        ...sharedMessageProperties,
      })
      notification.webhookMessageId = webhookMessageId
      context.webhookMessageCreated(webhookMessageId)
    }

    const [notificationId] = await knex('Notification').insert(notification)
    context.notificationCreated(notificationId)
  }
}

async function getNotifications(request) {
  const { auth, query, params } = request

  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)
  const notificationQuery = knex('Notification as n')
    .innerJoin('NotificationType as nt', 'nt.id', 'n.notificationTypeId')
    .leftJoin('Issue as iss', 'iss.Id', 'n.issueId')
    .leftJoin('Result as r', 'r.Id', 'n.resultId')
    .leftJoin('Partner as p', 'nt.partnerId', 'p.id')
    .leftJoin('WebhookMessage as wm', 'wm.id', 'n.webhookMessageId')
    .leftJoin('EmailMessage as em', 'em.id', 'n.emailMessageId')
    .leftJoin('SmsMessage as sm', 'sm.id', 'n.smsMessageId')
    .leftJoin('MessageStatus as msem', 'msem.id', 'em.messageStatusId')
    .leftJoin('MessageStatus as mssms', 'mssms.id', 'sm.messageStatusId')
    .leftJoin('MessageStatus as mswm', 'mswm.id', 'wm.messageStatusId')
    .where('n.notificationTypeId', params.notificationTypeId)
    .modify(addConstraints, dataConstraints, { partner: 'p', result: 'r' })

  const getCount = notificationQuery.clone().count('n.id as total').first()

  const getNotificationHistory = notificationQuery
    .clone()
    .modify(sortPageParams, query, 'n.createdOn')
    .select([
      knex.raw(
        'sum(case when mswm.externalId = "Sent" then 1 else 0 end) as webhookSent'
      ),
      knex.raw(
        'sum(case when mssms.externalId = "Sent" then 1 else 0 end) as smsSent'
      ),
      knex.raw(
        'sum(case when msem.externalId = "Sent" then 1 else 0 end) as emailSent'
      ),
      'n.createdOn as date',
      'n.issueId',
    ])
    .groupBy('n.issueId')

  const [{ total }, data] = await Promise.all([
    getCount,
    getNotificationHistory,
  ])

  return { ok: true, total, data }
}

async function saveNotificationType({
  id: notificationTypeId,
  partnerId,
  userId,
  payload,
  issueTypeId = null,
}) {
  const fileContentTypeId = await fileContentTypeToId('applicationJson')
  const messageSeverityId = await messageSeverityToId('Alert')
  const notificationTypeCategoryId = await notificationTypeCategoryToId(
    'resultBased'
  )
  const {
    areaItems,
    deviceLevelId,
    jobFunctions,
    name,
    result,
    //
    sendEmail,
    emailBody,
    emailSubject,
    //
    sendSms,
    smsBody,
    //
    sendWeb,
    webBody,
    webUrl,
  } = payload
  const now = new Date()
  const auditFields = {
    createdOn: now,
    createdBy: userId,
    updatedOn: now,
    updatedBy: userId,
  }

  return transact(async knex => {
    /**
     * helpers
     */
    const insertEmailTemplate = async () =>
      knex('EmailTemplate').insert({
        subject: emailSubject,
        body: emailBody,
        htmlBody: emailBody
          .split('\n')
          .map(line => `<div>${line}</div>`)
          .join(''),
        ...auditFields,
      })
    const insertSmsTemplate = async () =>
      knex('SmsTemplate').insert({
        message: smsBody,
        ...auditFields,
      })
    const insertWebHookTemplate = async () =>
      knex('WebhookTemplate').insert({
        method: 'POST',
        url: webUrl,
        payload: webBody,
        fileContentTypeId,
        ...auditFields,
      })
    let messageTypeId

    if (!notificationTypeId) {
      /**
       * insert base props in NotificationType (without messageTypeId yet)
       */
      ;[notificationTypeId] = await knex('NotificationType').insert({
        notificationTypeCategoryId,
        partnerId,
        issueTypeId,
        level: 1,
        canAcknowledge: 0,
        name,
        ...auditFields,
      })
      /**
       * create *Template items
       */
      let emailTemplateId = null
      let smsTemplateId = null
      let webHookTemplateId = null
      if (sendEmail) {
        ;[emailTemplateId] = await insertEmailTemplate()
      }
      if (sendSms) {
        ;[smsTemplateId] = await insertSmsTemplate()
      }
      if (sendWeb) {
        ;[webHookTemplateId] = await insertWebHookTemplate()
      }
      /**
       * create MessageType and then put it in NotificationType table with remaining props
       */
      ;[messageTypeId] = await knex('MessageType').insert({
        messageSeverityId,
        emailTemplateId,
        smsTemplateId,
        webHookTemplateId,
      })
    } else {
      let whereClause
      await knex('NotificationType')
        .update({
          name,
          updatedOn: now,
          updatedBy: userId,
        })
        .where({ id: notificationTypeId })
      ;({ messageTypeId } = await knex('NotificationType')
        .select('messageTypeId')
        .where({ id: notificationTypeId }))
      let { emailTemplateId, smsTemplateId, webHookTemplateId } = await knex(
        'MessageType'
      )
        .where({ id: messageTypeId })
        .select()

      /**
       * EmailTemplate
       */
      if (emailTemplateId) {
        whereClause = { id: emailTemplateId }
        // update or delete
        if (sendEmail) {
          await knex('EmailTemplate')
            .where(whereClause)
            .update({
              subject: emailSubject,
              body: emailBody,
              htmlBody: emailBody
                .split('\n')
                .map(line => `<div>${line}</div>`)
                .join(''),
              updatedOn: now,
              updatedBy: userId,
            })
        } else {
          await knex('EmailTemplate').where(whereClause).del()
        }
      } else if (sendEmail) {
        // insert
        ;[emailTemplateId] = await insertEmailTemplate()
      }
      /**
       * SmsTemplate
       */
      if (smsTemplateId) {
        whereClause = { id: smsTemplateId }
        // update or delete
        if (sendSms) {
          await knex('SmsTemplate')
            .update({
              message: smsBody,
              updatedOn: now,
              updatedBy: userId,
            })
            .where(whereClause)
        } else {
          await knex('SmsTemplate').where(whereClause).del()
        }
      } else if (sendSms) {
        ;[smsTemplateId] = await insertSmsTemplate()
      }
      /**
       * WebhookTemplate
       */
      if (webHookTemplateId) {
        whereClause = { id: webHookTemplateId }
        // update or delete
        if (sendWeb) {
          await knex('WebhookTemplate')
            .update({
              payload: webBody,
              url: webUrl,
              updatedOn: now,
              updatedBy: userId,
            })
            .where(whereClause)
        } else {
          await knex('WebhookTemplate').where(whereClause).del()
        }
      } else if (sendWeb) {
        ;[webHookTemplateId] = await insertWebHookTemplate()
      }
      //
      await knex('MessageType')
        .update({
          emailTemplateId,
          smsTemplateId,
          webHookTemplateId,
        })
        .where({ id: messageTypeId })
    }

    /**
     * update remaining fields in NotificationType
     */
    await knex('NotificationType')
      .update({
        messageTypeId,
        filterCondition: JSON.stringify({
          areaItems,
          deviceLevelId,
          jobFunctions,
          result,
        }),
      })
      .where({ id: notificationTypeId })

    return {
      ok: true,
      notificationTypeId,
    }
  }).catch(err => {
    return {
      ok: false,
      error: err.message,
    }
  })
}

async function saveNotification(request) {
  const { auth, params, payload } = request
  const { id } = params
  const user = await getUser(auth.credentials.name)
  const { partnerId, id: userId } = user
  const { notificationType } = payload

  if (notificationType === 'resultBased') {
    const { ok, notificationTypeId, error } = await saveNotificationType({
      id,
      partnerId,
      userId,
      payload,
    })
    if (!ok) {
      return Boom.internal(`Can not save notification: ${error}`)
    }
    return { ok: true, notificationTypeId }
  }

  return { ok: false, notificationTypeId: -1 }
}

module.exports = {
  listNotifications,
  getNotifications,
  createNotifications,
  shouldNotify,
  resultConditionsMet,
  getPeopleToNotify,
  saveNotification,
}
