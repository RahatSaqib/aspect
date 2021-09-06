const _ = require('lodash')
const Promise = require('bluebird')
const {
  knex,
  filterParams,
  filterDateRangeParams,
  sortPageParams,
} = require('../db')
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
const { messageStatusToId } = require('../shared/dictionary')
const {
  issueConditionsMet,
  evaluateArrayOfConditions,
} = require('../issue/issueEvaluation')

const evaluationMethods = {
  issueBased: issueConditionsMet,
  resultBased: resultConditionsMet,
}
async function resultCategoryFilters(queryBuilder, results, resultAlias) {
  if (results.length > 0) {
    queryBuilder
      .join('Assay as a', `${resultAlias}.assayId`, 'a.id')
      .leftJoin('ResultCategoryAssay as rca', function () {
        this.on('a.id', 'rca.assayId').andOn(
          'r.resultCategory1',
          'rca.resultCategoryId'
        )
      })
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
    _.each(results, elem => {
      queryBuilder.orWhere(whereBuilder => {
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
              .whereIn('rca.externalId', itemsToFilter)
              .orWhereIn('rca2.externalId', itemsToFilter)
          )
        }
      })
    })
  }
}

async function geographyFilters(
  queryBuilder,
  { areaItems, deviceLevelId },
  { device = 'd', geography = 'g' }
) {
  if (deviceLevelId === 'state') {
    queryBuilder.whereIn(
      `${geography}.stateId`,
      _.map(areaItems, area => _.toInteger(area.value))
    )
  }
  if (deviceLevelId === 'lga') {
    queryBuilder.whereIn(
      `${geography}.lgaId`,
      _.map(areaItems, area => _.toInteger(area.value))
    )
  }
  if (deviceLevelId === 'site') {
    queryBuilder.whereIn(
      `${device}.siteId`,
      _.map(areaItems, area => _.toInteger(area.value))
    )
  }
}

async function jobFunctionFilters(queryBuilder, { jobFunctions = [] }) {
  return true
}

async function resultConditionsMet(queryBuilder, filterCondition, aliases) {
  const { result = 'r' } = aliases
  await resultCategoryFilters(queryBuilder, filterCondition, result)
  await geographyFilters(queryBuilder, filterCondition, aliases)
}

async function listNotifications(request) {
  const { query, auth } = request

  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)

  const notificationQuery = knex('Notification as n')
    .innerJoin('NotificationType as nt', 'nt.id', 'n.notificationTypeId')
    .leftJoin('MessageType as m', 'm.id', 'nt.messageTypeId')
    .leftJoin('Partner as p', 'nt.partnerId', 'p.id')
    .modify(filterParams, query, {})
    .modify(filterDateRangeParams, query, 'lastTriggeredOn')
    .modify(addConstraints, dataConstraints, { partner: 'p' })

  const getItems = notificationQuery
    .clone()
    .leftJoin('Job as j', 'nt.jobFunctionId', 'j.JobfunctionId')
    .leftJoin('Person as per', 'j.personId', 'per.id')
    .select(
      'n.notificationTypeId as id',
      'nt.name',
      knex.raw('count(distinct n.issueId) as totalTriggers'),
      columnCount('alert'),
      knex.raw('COUNT(DISTINCT per.id) as contactsCount'),
      knex.raw(
        "SUBSTRING_INDEX(GROUP_CONCAT(DISTINCT per.`name`),',',5) as contacts"
      )
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
  const {
    filterCondition = null,
    evaluationParameter,
    evaluationFilterParameters,
    notificationTypeCategoryId,
  } = action
  const meetCondition = true
  // if (filterCondition) {
  //   if (!evaluationMethods[notificationTypeCategoryId]) {
  //     throw new Error(
  //       `Unrecognised evaluation method in condition ${notificationTypeCategoryId}`
  //     )
  //   }
  //   extraConditions =
  //     (knex, action.resultId, evaluationParameter, evaluationFilterParameters)
  // }
  // Find escalation policy for the issue
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
  await Promise.each(policies, async policy => {
    if (_.isNil(policy.jobFunctionId)) {
      await createNotificationIfNotCreatedAlready(
        action,
        { policy, now },
        { messageContext: context, knex }
      )
    } else {
      if (policy.jobFunctionId !== jobFunctionId) {
        ;({ jobFunctionId, level: jobFunctionLevel } = policy)
      } else if (policy.level !== jobFunctionLevel) {
        // This is a lower level for this particular job function
        // continue until we get to end of list or new job function
        /* eslint-disable no-continue */
        return Promise.resolve()
      }
      const tags = await getTagsByPolicy(knex, policy)
      const people = await getPeopleToNotify(
        knex,
        policy,
        tags,
        filterCondition
      )
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
  return [
    ...notificationTypeTagIds,
    ...siteTagIds,
    ...deviceTagIds,
    ...resultTagIds,
  ]
}

async function getNotificationPolicy(
  txKnex,
  action,
  extraConditionsFunction,
  extraConditions
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
  return txKnex('NotificationType as nt')
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
              .select('r.siteId', 'r.deviceId', 'r.id as resultId')
              .as('result')
          )
          .join('Device as d', 'result.deviceId', 'd.id')
          .leftJoin('Geography as g', 'd.geographyId', 'g.id')
          .where('ntc.externalId', 'resultBased')
      }
    }, action)
    .orderBy('nt.jobFunctionId', 'DESC')
    .orderBy('nt.level', 'DESC')
    .modify(extraConditionsFunction, extraConditions)
    .select(selectColums.concat(extraFields))
}

async function getPeopleToNotify(
  txKnex,
  policy,
  tags,
  { jobFunctions = null }
) {
  let peopleTagIncluded = false
  const people = await txKnex('Job as j')
    .join('JobFunction as jf', 'j.jobFunctionId', 'jf.id')
    .modify(queryBuilder => {
      if (policy.sendToContactsWithMatchingTags) {
        peopleTagIncluded = true
        queryBuilder
          .join('PersonTag as pt', 'j.personId', 'pt.personId')
          .whereIn('pt.tagId', _.uniq(tags))
      }
      if (policy.jobFunctionId)
        queryBuilder.where('jf.id', policy.jobFunctionId)
      if (jobFunctions) {
        _.each(jobFunctions, ({ jobFunctionId, tags }) => {
          queryBuilder.orWhere(builder => {
            builder.where('jf.id', jobFunctionId)
            if (tags.length > 0) {
              if (!peopleTagIncluded) {
                builder.join('PersonTag as pt', 'j.personId', 'pt.personId')
                peopleTagIncluded = true
              }
              builder.whereIn('pt.tagId', _.uniq(_.map(tags, tag => tag.value)))
            }
          })
        })
      }
    })
    .distinct('j.personId as id')
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
        policy.jobFunctionId
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

module.exports = {
  listNotifications,
  getNotifications,
  createNotifications,
  shouldNotify,
  resultConditionsMet,
}
