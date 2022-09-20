const Boom = require('@hapi/boom')
const _ = require('lodash')
const Promise = require('bluebird')
const { subDays } = require('date-fns')
const { knex, sortPageParams } = require('../db')
const { getJobConstraints, addConstraints, getConstraints } = require('../auth/constraints')
const { notificationCreated } = require('./actions')
const { notificationTypeCreated } = require('../notificationType/actions')
const { alertMessageCreated } = require('../alert/actions')
const { emailMessageCreated } = require('../email/actions')
const { smsMessageCreated } = require('../sms/actions')
const { webhookMessageCreated } = require('../webhook/actions')
const { messageStatusToId } = require('../shared/dictionary')
const logger = require('../shared/logger')
const NotificationCache = require('./notificationCache')

async function clearCache() {
  return NotificationCache.getInstance(knex).refreshCache()
}

const evaluationMethods = {
  issueBased: issueConditionsMet,
  resultBased: resultConditionsMet,
}
function resultCategoryFilters(queryBuilder, filterConditions, tblResultAlias) {
  const { result: resultFilters } = filterConditions || {}

  if (resultFilters && resultFilters.length > 0) {
    queryBuilder
      .join('Assay as a', `${tblResultAlias}.assayId`, 'a.id')
      .leftJoin('ResultCategory as rc1', `${tblResultAlias}.resultCategory1`, 'rc1.id')
      .leftJoin('ResultCategoryGroup as rcg', function () {
        this.on(`a.id`, 'rcg.assayId')
          .andOn(function () {
            this.on(knex.raw('rcg.resultCategory1Id IS NULL')).orOn(
              `${tblResultAlias}.resultCategory1`,
              'rcg.resultCategory1Id'
            )
          })
          .andOn(function () {
            this.on(knex.raw('rcg.resultCategory2Id IS NULL')).orOn(
              `${tblResultAlias}.resultCategory2`,
              'rcg.resultCategory2Id'
            )
          })
      })
      .leftJoin('ResultCategory as rc2', `${tblResultAlias}.resultCategory2`, 'rc2.id')
    queryBuilder.where(resultBuilder =>
      _.each(resultFilters, filterElem => {
        resultBuilder.orWhere(whereBuilder => {
          whereBuilder.where('a.externalId', filterElem.assayId)
          if (_.find(filterElem.resultCategoryId, item => item.scope === 'ResultCategoryGroups'))
            whereBuilder.whereIn(
              'rcg.externalId',
              _.map(
                _.filter(filterElem.resultCategoryId, item => item.scope === 'ResultCategoryGroups'),
                obj => obj.value
              )
            )
          if (_.find(filterElem.resultCategoryId, item => item.scope === 'ResultCategories')) {
            const itemsToFilter = _.map(
              _.filter(filterElem.resultCategoryId, item => item.scope === 'ResultCategories'),
              obj => obj.value
            )
            whereBuilder.andWhere(builder =>
              builder.whereIn('rc1.externalId', itemsToFilter).orWhereIn('rc2.externalId', itemsToFilter)
            )
          }
        })
      })
    )
  }
}

function geographyFilters(queryBuilder, filterConditions, aliases) {
  const { areaItems, deviceLevelId } = filterConditions || {}
  const { device = 'd', geography = 'g' } = aliases

  if (areaItems && deviceLevelId) {
    switch (deviceLevelId) {
      case 'state':
        queryBuilder.whereIn(
          `${geography}.stateId`,
          _.map(areaItems, area => _.toInteger(area.value))
        )
        break
      case 'lga':
        queryBuilder.whereIn(
          `${geography}.lgaId`,
          _.map(areaItems, area => _.toInteger(area.value))
        )
        break
      case 'lab':
        queryBuilder.whereIn(
          `${device}.siteId`,
          _.map(areaItems, area => _.toInteger(area.value))
        )
        break
      default:
        break
    }
  }
}

function resultConditionsMet(queryBuilder, filterCondition, aliases) {
  const tblResultAlias = aliases.result ? aliases.result : 'r'
  resultCategoryFilters(queryBuilder, filterCondition, tblResultAlias)
  geographyFilters(queryBuilder, filterCondition, aliases)
}

function issueConditionsMet(queryBuilder, filterCondition, aliases) {
  geographyFilters(queryBuilder, filterCondition, aliases)
}

async function createNotifications(knex, action, context) {
  const now = new Date()
  const { filterCondition = null, notificationTypeCategoryId = 'issueBased' } = action
  const policies = await getNotificationPolicy(
    knex,
    action,
    evaluationMethods[notificationTypeCategoryId],
    filterCondition
  )

  const { jobFunctions = [], persons = [], sendToClinician = false, sendToPatient = false } = filterCondition || {}

  if (!_.isEmpty(policies)) {
    const [firstPolicy] = policies
    if (firstPolicy && (sendToClinician || sendToPatient)) {
      const nonPersonsToNotify = _.filter(
        [
          {
            notify: sendToPatient,
            phone: firstPolicy.patientPhone,
            email: firstPolicy.patientEmail,
          },
          {
            notify: sendToClinician,
            phone: firstPolicy.clinicianPhone,
            to: firstPolicy.clinicianEmail,
          },
        ],
        elem => !!elem.notify
      )
      _.each(nonPersonsToNotify, personToSend => {
        const policy = {
          policy: _.omit(firstPolicy, ['jobFunctionId']),
          now,
        }
        createNotificationIfNotCreatedAlready(
          action,
          policy,
          {
            messageContext: context,
            knex,
          },
          personToSend
        )
      })
    }
    await Promise.each(policies, async policy => {
      if (_.isEmpty(jobFunctions) && _.isEmpty(persons)) {
        await createNotificationIfNotCreatedAlready(action, { policy, now }, { messageContext: context, knex })
      } else {
        const tags = await getTagsByPolicy(knex, policy)
        const people = await getPeopleToNotify(knex, policy, tags, jobFunctions, persons)

        await sendNotificationsToPeople(knex, context, people, policy, action)
      }
    })
  }
}

async function getTagsByPolicy(txKnex, policy) {
  const notificationTypeTagIds = policy.sendToContactsWithMatchingTags
    ? await txKnex('NotificationTypeTag').where({ notificationTypeId: policy.id }).pluck('tagId')
    : []
  const siteTagIds =
    policy.sendToContactsWithMatchingTags && policy.siteId
      ? await txKnex('SiteTag').where({ siteId: policy.siteId }).pluck('tagId')
      : []
  const deviceTagIds =
    policy.sendToContactsWithMatchingTags && policy.deviceId
      ? await txKnex('DeviceTag').where({ deviceId: policy.deviceId }).pluck('tagId')
      : []
  const resultTagIds =
    policy.sendToContactsWithMatchingTags && policy.resultId
      ? await txKnex('ResultTag').where({ resultId: policy.resultId }).pluck('tagId')
      : []
  return [...notificationTypeTagIds, ...siteTagIds, ...deviceTagIds, ...resultTagIds]
}

async function getNotificationPolicy(txKnex, action, extraConditionsFunction = () => true, extraConditions = {}) {
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
    knex.raw(
      'CASE JSON_CONTAINS(nt.filterCondition, "true", "$.sendEmail") WHEN 1 THEN mt.emailTemplateId ELSE NULL END as emailTemplateId'
    ),
    knex.raw(
      'CASE JSON_CONTAINS(nt.filterCondition, "true", "$.sendSms") WHEN 1 THEN mt.smsTemplateId ELSE NULL END as smsTemplateId'
    ),
    knex.raw(
      'CASE JSON_CONTAINS(nt.filterCondition, "true", "$.sendWeb") WHEN 1 THEN mt.webhookTemplateId ELSE NULL END as webhookTemplateId'
    ),
  ]
  let extraFields = []
  const aliases = { geography: 'g' }
  const records = txKnex('NotificationType as nt')
    .join('NotificationTypeCategory as ntc', 'nt.notificationTypeCategoryId', 'ntc.id')
    .join('MessageType as mt', 'nt.messageTypeId', 'mt.id')
    .modify((queryBuilder, { resultId, issueId, notificationTypeId }) => {
      if (!_.isNil(issueId)) {
        extraFields = ['i.siteId', 'i.deviceId', 'i.resultId', 'i.id as issueId']
        queryBuilder
          .join('Issue as i', joinBuilder =>
            // If issue is escalated past configured level, send again
            // on escalation to maximum configured level
            joinBuilder.on('i.issueTypeId', 'nt.issueTypeId').andOn('i.partnerId', 'nt.partnerId')
          )
          .leftJoin('Geography as g', 'i.geographyId', 'g.id')
          .where({ 'i.id': issueId })
        aliases.issue = 'i'
      } else if (!_.isNil(resultId)) {
        extraFields = [
          'result.siteId as siteId',
          'result.deviceId as deviceId',
          'result.resultId as resultId',
          knex.raw('result.patientData->>"$.phone" as patientPhone'),
          knex.raw('result.patientData->>"$.email" as patientEmail'),
          knex.raw('result.patientData->>"$.clinicianPhone" as clinicianPhone'),
          knex.raw('result.patientData->>"$.clinicianEmail" as clinicianPhone'),
        ]
        queryBuilder
          .crossJoin(
            knex('Result as r')
              .where('r.id', resultId)
              .andWhere('r.endedOn', '>=', subDays(new Date(), 30))
              .select(
                'r.siteId',
                'r.assayId',
                'r.deviceId',
                'r.id as resultId',
                'r.resultCategory1',
                'r.resultCategory2',
                'r.patientData'
              )
              .as('result')
          )
          .join('Device as d', 'result.deviceId', 'd.id')
          .join('DeviceApproval as da', 'da.id', 'd.deviceApprovalId')
          .leftJoin('Geography as g', 'd.geographyId', 'g.id')
          .where('ntc.externalId', 'resultBased')
          .andWhere('da.token', 'approved')
        aliases.result = 'result'
        aliases.device = 'd'
      }

      if (notificationTypeId) queryBuilder.andWhere('nt.id', notificationTypeId)
    }, action)
    .orderBy('nt.jobFunctionId', 'DESC')
    .orderBy('nt.level', 'DESC')
    .modify(extraConditionsFunction, extraConditions, aliases)
    .where('nt.enabled', true)
    .distinct(selectColums.concat(extraFields))
  return records
}

async function getPeopleToNotify(txKnex, policy, tags, jobFunctions, persons) {
  const people = txKnex('Person as p')
    .innerJoin('Job as j', 'p.id', 'j.personId')
    .innerJoin('JobFunction as jf', 'j.jobFunctionId', 'jf.id')
    .leftJoin('PersonTag as pt', 'j.personId', 'pt.personId')
    .where('p.disabled', false)
    .modify(qWhere => {
      // Where the person is NOT disabled and...
      if (
        policy.sendToContactsWithMatchingTags ||
        policy.jobFunctionId ||
        !_.isEmpty(jobFunctions) ||
        !_.isEmpty(persons)
      ) {
        qWhere.andWhere(_qWhere => {
          // The filter by tag matches...
          if (policy.sendToContactsWithMatchingTags) {
            _qWhere.orWhereIn('pt.tagId', _.uniq(tags))
          }

          // Or filter by a list of job functions scoped to person tags...
          if (!_.isEmpty(jobFunctions)) {
            _.each(jobFunctions, ({ jobFunctionId, tags = [] }) => {
              _qWhere.orWhere(jfWhere => {
                jfWhere.where('jf.id', jobFunctionId)
                if (tags.length > 0) {
                  jfWhere.whereIn('pt.tagId', _.uniq(_.map(tags, tag => tag.value)))
                }
              })
            })
          }

          // Or filter by individual persons...
          if (!_.isEmpty(persons)) {
            _.each(persons, ({ personId }) => {
              _qWhere.orWhere(pWhere => pWhere.where('p.id', personId))
            })
          }
        })
      }
    })
    .distinct('p.id as id', 'j.jobFunctionId')
  return people
}

async function sendNotificationsToPeople(txKnex, context, people, policy, action) {
  const now = new Date()

  // Issue notification to every person assigned, (subscriber will create as necessary)
  await Promise.all(
    people.map(async person => {
      const shouldNotifyToPerson = await shouldNotify(txKnex, action, person.id, person.jobFunctionId)
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

async function shouldNotify(txKnex, { issueId = null, resultId = null }, personId, jobFunctionId) {
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
  return txKnex(table)
    .leftJoin('Device as d', 'i.deviceId', 'd.id')
    .leftJoin('Site as s', 'i.siteId', 's.id')
    .modify(builder => {
      if (!_.isNil(issueId)) {
        builder.leftJoin('Geography as g', 'i.geographyId', 'g.id')
      } else {
        builder.leftJoin('Geography as g', 'd.geographyId', 'g.id')
      }
    })
    .leftJoin('Partner as p', 'i.partnerId', 'p.id')
    .modify(addConstraints, constraints, aliasMapping)
    .where({ 'i.id': issueId || resultId })
    .first('i.id')
}

async function createNotificationIfNotCreatedAlready(
  { issueId = null, resultId = null },
  { personId = null, policy, now = new Date() },
  { messageContext: context, knex },
  nonPersonToSend = {}
) {
  const { notify: notifyANonPerson = false, email: to, phone } = nonPersonToSend

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
    data: notifyANonPerson ? JSON.stringify({ to, phone }) : null,
  }
  const existingNotification = await knex('Notification')
    .where(_.omit(notification, ['data']))
    .modify(builder => {
      if (notifyANonPerson) {
        if (to) builder.whereRaw(`data->>"$.to"=?`, [to])
        if (phone) builder.whereRaw(`data->>"$.phone"=?`, [phone])
      }
    })
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
    if (personId || !!notifyANonPerson) {
      if (policy.alertTemplateId != null) {
        const [alertMessageId] = await knex('AlertMessage').insert({
          alertTemplateId: policy.alertTemplateId,
          ...sharedMessageProperties,
        })
        notification.alertMessageId = alertMessageId
        context.alertMessageCreated(alertMessageId)
      }

      if (policy.emailTemplateId != null) {
        const [emailMessageId] = await knex('EmailMessage').insert({
          emailTemplateId: policy.emailTemplateId,
          ...sharedMessageProperties,
          to,
        })
        notification.emailMessageId = emailMessageId
        context.emailMessageCreated(emailMessageId)
      }
      if (policy.smsTemplateId != null) {
        const [smsMessageId] = await knex('SmsMessage').insert({
          smsTemplateId: policy.smsTemplateId,
          ...sharedMessageProperties,
          phoneNumber: phone,
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
}

async function getNotification(request) {
  const { params } = request
  const { id } = params

  const notification = await knex
    .select(
      'ntc.name as notificationTypeName',
      'ntc.externalId as notificationType',
      'nt.name as name',
      'nt.filterCondition as filterCondition',
      'et.subject as emailSubject',
      'et.body as emailBody',
      'st.message as smsBody',
      'wt.url as webUrl',
      'wt.payload as webBody',
      'nt.enabled'
    )
    .from('NotificationType as nt')
    .innerJoin('NotificationTypeCategory as ntc', 'nt.notificationTypeCategoryId', 'ntc.id')
    .leftJoin('MessageType as mt', 'mt.id', 'nt.messageTypeId')
    .leftJoin('EmailTemplate as et', 'et.id', 'mt.emailTemplateId')
    .leftJoin('SmsTemplate as st', 'st.id', 'mt.smsTemplateId')
    .leftJoin('WebhookTemplate as wt', 'wt.id', 'mt.webhookTemplateId')
    .where('nt.id', id)
    .andWhere('ntc.externalId', 'resultBased')
    .first()
  return { ok: true, data: notification }
}

async function getNotifications(request) {
  const { auth, query, params } = request

  const { externalId: category } = await knex('NotificationType as nt')
    .innerJoin('NotificationTypeCategory as ntc', 'nt.notificationTypeCategoryId', 'ntc.id')
    .where('nt.id', params.notificationTypeId)
    .first('ntc.externalId')

  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)
  let notificationQuery = knex('Notification as n')
    .innerJoin('NotificationType as nt', 'nt.id', 'n.notificationTypeId')
    .innerJoin('NotificationTypeCategory as ntc', 'nt.notificationTypeCategoryId', 'ntc.id')
    .leftOuterJoin('Partner as p', 'nt.partnerId', 'p.id')
    .leftOuterJoin('WebhookMessage as wm', 'wm.id', 'n.webhookMessageId')
    .leftOuterJoin('EmailMessage as em', 'em.id', 'n.emailMessageId')
    .leftOuterJoin('Person as pEm', 'em.personId', 'pEm.id')
    .leftOuterJoin('SmsMessage as sm', 'sm.id', 'n.smsMessageId')
    .leftOuterJoin('Person as pSm', 'sm.personId', 'pSm.id')
    .leftOuterJoin('MessageStatus as mswebhook', 'mswebhook.id', 'wm.messageStatusId')
    .leftOuterJoin('MessageStatus as msem', 'msem.id', 'em.messageStatusId')
    .leftOuterJoin('MessageStatus as mssms', 'mssms.id', 'sm.messageStatusId')
    .leftOuterJoin('MessageStatus as mswm', 'mswm.id', 'wm.messageStatusId')
    .where('n.notificationTypeId', params.notificationTypeId)
    .modify(addConstraints, dataConstraints, { partner: 'p' })
  const isResultBased = category === 'resultBased'
  if (isResultBased) {
    notificationQuery = notificationQuery.leftOuterJoin('Result as r', 'r.Id', 'n.resultId')
  } else {
    notificationQuery = notificationQuery
      .leftOuterJoin('Issue as iss', 'iss.Id', 'n.issueId')
      .leftOuterJoin('Result as r', 'iss.resultId', 'r.id')
  }

  const getCount = notificationQuery
    .clone()
    .count({
      /**
       * see how we count `totalTriggers` in func `listNotifications()` in this file.
       * Here we also count by resultId or issueId
       */
      total: knex.raw(`
        DISTINCT
        CASE
          WHEN ntc.externalId = 'resultBased'
          THEN n.resultId
          ELSE n.issueId
        END
      `),
    })
    .first()

  const getNotificationHistory = notificationQuery
    .clone()
    .modify(sortPageParams, query, 'n.createdOn')
    .select([
      'n.createdOn as date',
      'n.issueId',
      's.externalId as sampleId',
      knex.raw(`
      GROUP_CONCAT(DISTINCT CONCAT(pEm.name,'-',msem.externalId) SEPARATOR "|") AS emailRecipients
      `),
      knex.raw(`
      GROUP_CONCAT(DISTINCT CONCAT(pSm.name,'-',mssms.externalId) SEPARATOR "|") AS smsRecipients
      `),
      knex.raw(`
      GROUP_CONCAT(DISTINCT CONCAT(wm.url,'-',mswebhook.externalId) SEPARATOR "|") AS webhookRecipients
      `),
      knex.raw(`
        JSON_UNQUOTE(JSON_EXTRACT(r.patientData, "$.id")) as patientId
      `),
      /**
       * `groupingParam` is a temporal field for grouping by it.
       * We are grouping by either n.issueId (`issueBased`)
       * or n.resultId (`resultBased`)
       */
      knex.raw(`
        CASE
          WHEN ntc.externalId = 'resultBased'
          THEN n.resultId
          ELSE n.issueId
        END as groupingParam
      `),
    ])
    .leftJoin('Sample as s', 's.id', 'r.sampleId')
    .count({
      webhookSent: knex.raw(`
        DISTINCT
        CASE WHEN mswm.externalId = "Sent"
        THEN n.id
        ELSE null END
      `),
      webhookWithErrors: knex.raw(`
      DISTINCT
      CASE WHEN mswm.externalId = "Error"
      THEN n.id
      ELSE null END
    `),
      webhookPending: knex.raw(`
    DISTINCT
    CASE WHEN mswm.externalId = "Pending"
    THEN n.id
    ELSE null END
  `),
      smsSent: knex.raw(`
        DISTINCT
        CASE WHEN mssms.externalId = "Sent"
        THEN n.id
        ELSE null END
      `),
      smsWithErrors: knex.raw(`
      DISTINCT
      CASE WHEN mssms.externalId = "Error"
      THEN n.id
      ELSE null END
    `),
      smsPending: knex.raw(`
    DISTINCT
    CASE WHEN mssms.externalId = "Pending"
    THEN n.id
    ELSE null END
  `),
      emailSent: knex.raw(`
        DISTINCT
        CASE WHEN msem.externalId = "Sent"
        THEN n.id
        ELSE null END
      `),
      emailWithErrors: knex.raw(`
      DISTINCT
      CASE WHEN msem.externalId = "Error"
      THEN n.id
      ELSE null END
    `),
      emailPending: knex.raw(`
    DISTINCT
    CASE WHEN msem.externalId = "Pending"
    THEN n.id
    ELSE null END
  `),
    })
    .modify((builder, resultBased) => {
      if (resultBased) {
        builder.select('r.id as resultId')
      } else builder.join('Issue as i', 'i.id', 'n.issueId').select('i.resultId')
    }, isResultBased)
    .groupBy('groupingParam')

  const [{ total }, data] = await Promise.all([getCount, getNotificationHistory])

  const items = data.map(item => ({
    ..._.omit(item, ['groupingParam']),
    emailRecipients: item.emailRecipients ? item.emailRecipients.split('|') : null,
    smsRecipients: item.smsRecipients ? item.smsRecipients.split('|') : null,
  }))
  return { ok: true, total, data: items }
}

/**
 * Does a deeper validation of the filterCondition object.
 * @param {object} filterCondition The filterCondition object
 * @returns true if filterCondition is correct, or a Boom object if a problem was detected
 */

async function deleteNotification(request) {
  const {
    params,
    plugins: { messageContext },
  } = request
  const { notificationId: id } = params

  try {
    await knex('NotificationType').where({ id }).delete()
    if (!messageContext.notificationTypeCreated) messageContext.bindActionCreators({ notificationTypeCreated })
    messageContext.notificationTypeCreated(id)
  } catch (e) {
    logger.info({ info: `NotificationType ${id} cannot be deleted`, e }, { reLabel: 'aspect:api:notification:delete' })
    return Boom.badData(`Can not delete this notification type because it already triggered notifications`)
  }

  return { ok: true }
}

module.exports = {
  getNotifications,
  getNotification,
  createNotifications,
  shouldNotify,
  resultConditionsMet,
  getPeopleToNotify,

  deleteNotification,

  clearCache,
}
