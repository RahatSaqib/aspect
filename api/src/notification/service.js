const Boom = require('@hapi/boom')
const _ = require('lodash')
const Promise = require('bluebird')
const { subDays } = require('date-fns')
const { knex, filterParams, filterDateRangeParams, sortPageParams, transact } = require('../db')
const { getUser } = require('../auth/service')
const { getJobConstraints, addConstraints, getConstraints } = require('../auth/constraints')
const { notificationCreated } = require('./actions')
const { notificationTypeCreated } = require('../notificationType/actions')
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
const logger = require('../shared/logger')

const evaluationMethods = {
  issueBased: () => true, // this will be developed once we move the issue based notification to the ui
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

async function listNotifications(request) {
  const { query, auth } = request

  const subquery = knex('NotificationType as nti')
    .leftOuterJoin('JobFunction AS jf', leftBuilder =>
      leftBuilder
        .on(
          knex.raw(
            `JSON_SEARCH(
              nti.filterCondition->>'$.jobFunctions[*].jobFunctionId',
              'one',
              jf.id
            ) IS NOT NULL
          `
          )
        )
        .orOn('nti.jobFunctionId', 'jf.id')
    )
    .leftOuterJoin('Person AS per', leftBuilder =>
      leftBuilder.on(
        knex.raw(
          ` JSON_SEARCH(
            nti.filterCondition->>'$.persons[*].personId',
            'one',
            per.id
          ) IS NOT NULL`
        )
      )
    )
    .distinct('nti.id AS notificationTypeId', 'per.name AS personName', 'per.id as personId', 'jf.name AS jfName')

  const dataConstraints = await getConstraints(auth.credentials)

  const notificationQuery = knex('NotificationType as nt')
    .innerJoin('NotificationTypeCategory as ntc', 'nt.notificationTypeCategoryId', 'ntc.id')
    .leftOuterJoin('Notification as n', 'nt.id', 'n.notificationTypeId')
    .leftJoin('MessageType as m', 'm.id', 'nt.messageTypeId')
    .leftJoin('Partner as p', 'nt.partnerId', 'p.id')
    .where(builder => {
      builder.whereNotNull('n.id').orWhere('ntc.externalId', 'resultBased')
    })
    .modify(filterParams, query, {
      notificationName: 'nt.name',
    })
    .modify(filterDateRangeParams, query, 'lastTriggeredOn')
    .modify(addConstraints, dataConstraints, { partner: 'p' })
    .max('n.createdOn as lastTriggeredOn')
    .groupBy('nt.id')

  const getItems = notificationQuery
    .clone()
    .leftOuterJoin(subquery.as('filters'), 'nt.id', 'filters.notificationTypeId')
    .modify(sortPageParams, query, 'nt.name')
    .select(
      'nt.id as id',
      'nt.name',
      'nt.enabled',
      knex.raw(`count(distinct n.id) as totalTriggers`),
      columnCount('alert'),
      knex.raw('COUNT(DISTINCT filters.jfName) as jobFunctionsCount'),
      knex.raw(`GROUP_CONCAT(DISTINCT filters.jfName SEPARATOR ', ') as jobFunctions`),
      knex.raw('COUNT(DISTINCT filters.personName) as personsCount'),
      knex.raw(`GROUP_CONCAT(DISTINCT filters.personName SEPARATOR ', ') as persons`),
      columnCount('alert'),
      knex.raw(`nt.filterCondition->>'$.sendToPatient' as sendToPatient`),
      'ntc.externalId as typeCategory'
    )

  function columnCount(column) {
    return knex.raw(
      `SUM(CASE
        WHEN m.${column}TemplateId IS NULL THEN 0
        ELSE CASE WHEN n.${column}MessageId IS NULL THEN 0 ELSE 1 END END) as ${column}Count`
    )
  }

  const getCount = knex.count('* as count').from(notificationQuery.clone().as('mainQuery')).first()

  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  return { ok: true, total, data, length: data.length }
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
  // for each job function, find all policies with maximum constrained level,
  // since we are ordered by, max level at first position and filter all with same
  let jobFunctionId = null
  let jobFunctionLevel = null
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
      if (_.isNil(policy.jobFunctionId) && _.isEmpty(jobFunctions) && _.isEmpty(persons)) {
        await createNotificationIfNotCreatedAlready(action, { policy, now }, { messageContext: context, knex })
      } else {
        if (_.isEmpty(jobFunctions) && policy.jobFunctionId) {
          if (policy.jobFunctionId !== jobFunctionId) {
            ;({ jobFunctionId, level: jobFunctionLevel } = policy)
          } else if (policy.level !== jobFunctionLevel) {
            // This is a lower level for this particular job function
            // continue until we get to end of list or new job function
            /* eslint-disable no-continue */
            return Promise.resolve()
          }
        }

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
          knex.raw('result.patientData->>"$.phone" as patientPhone'),
          knex.raw('result.patientData->>"$.email" as patientEmail'),
          knex.raw('result.patientData->>"$.clinicianPhone" as clinicianPhone'),
          knex.raw('result.patientData->>"$.clinicianEmail" as clinicianPhone'),
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
          // Or filter by job function ID (used on prev version of notifications)...
          if (policy.jobFunctionId) _qWhere.orWhere('jf.id', policy.jobFunctionId)

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
const validateFilterCondition = async filterCondition => {
  const { jobFunctions, persons } = filterCondition
  if (jobFunctions) {
    const jobFunctionsIds = jobFunctions.map(jf => jf.jobFunctionId)
    const existingJobFunctions = await knex('JobFunction').whereIn('id', jobFunctionsIds)
    if (jobFunctionsIds.length !== existingJobFunctions.length)
      return Boom.badRequest('Attempt to set unexisting job function to notification')
  }
  if (persons) {
    const personsIds = persons.map(p => p.personId)
    const existingPersons = await knex('Person as p')
      .leftJoin('Job as j', 'p.id', 'j.personId')
      .whereIn('p.id', personsIds)
      .groupBy('p.id')
      .select(['p.id as personId', knex.raw('COUNT(j.id) as numberOfJobs')])
    if (personsIds.length !== existingPersons.length)
      return Boom.badRequest('Attempt to set unexisting person to notification')
    if (existingPersons.filter(p => _.isNil(p.numberOfJobs) || p.numberOfJobs === 0).length > 0)
      return Boom.badRequest('Attempt to set to notifications persons without assigned jobs')
  }
  return true
}

async function saveNotificationType({ id: notificationTypeId, partnerId, userId, payload, issueTypeId = null }) {
  const fileContentTypeId = await fileContentTypeToId('applicationJson')
  const messageSeverityId = await messageSeverityToId('Alert')
  const notificationTypeCategoryId = await notificationTypeCategoryToId('resultBased')
  const {
    areaItems,
    deviceLevelId,
    jobFunctions,
    persons,
    sendToPatient,
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
    enabled,
  } = payload
  const now = new Date()
  const auditFields = {
    createdOn: now,
    createdBy: userId,
    updatedOn: now,
    updatedBy: userId,
  }

  return transact(async knex => {
    // TODO: add extra validations for the other filterCondition properties
    const filterConditionValidation = await validateFilterCondition({
      jobFunctions,
      persons,
      sendToPatient,
    })
    if (filterConditionValidation !== true) return filterConditionValidation

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
        enabled,
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
          enabled,
        })
        .where({ id: notificationTypeId })
      ;({ messageTypeId } = await knex
        .select('messageTypeId')
        .from('NotificationType')
        .where({ id: notificationTypeId })
        .first())
      let { emailTemplateId, smsTemplateId, webHookTemplateId } = await knex
        .select('emailTemplateId', 'smsTemplateId', 'webHookTemplateId')
        .from('MessageType')
        .where('id', messageTypeId)
        .first()

      /**
       * EmailTemplate
       */
      if (emailTemplateId) {
        whereClause = { id: emailTemplateId }
        // update
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
        // update
        if (sendSms) {
          await knex('SmsTemplate')
            .update({
              message: smsBody,
              updatedOn: now,
              updatedBy: userId,
            })
            .where(whereClause)
        }
      } else if (sendSms) {
        ;[smsTemplateId] = await insertSmsTemplate()
      }
      /**
       * WebhookTemplate
       */
      if (webHookTemplateId) {
        whereClause = { id: webHookTemplateId }
        // update
        if (sendWeb) {
          await knex('WebhookTemplate')
            .update({
              payload: webBody,
              url: webUrl,
              updatedOn: now,
              updatedBy: userId,
            })
            .where(whereClause)
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
          persons,
          result,
          sendEmail,
          sendSms,
          sendToPatient,
          sendWeb,
          enabled,
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
  const {
    auth,
    params,
    payload,
    plugins: { messageContext },
  } = request
  const { id } = params
  const user = await getUser(auth.credentials.name)
  const { partnerId, id: userId } = user
  const { notificationType } = payload
  if (notificationType === 'resultBased') {
    const result = await saveNotificationType({
      id,
      partnerId,
      userId,
      payload,
    })

    if (result instanceof Boom.Boom) return result

    const { ok, notificationTypeId, error } = result
    if (!ok) {
      return Boom.internal(`Can not save notification: ${error}`)
    }
    if (!messageContext.notificationTypeCreated) messageContext.bindActionCreators({ notificationTypeCreated })
    messageContext.notificationTypeCreated(notificationTypeId)

    return { ok: true, notificationTypeId }
  }

  return { ok: false, notificationTypeId: -1 }
}

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

async function saveStatusNotification(request) {
  const { auth, params, payload } = request
  const { id } = params
  const user = await getUser(auth.credentials.name)
  const { partnerId, id: userId } = user

  const result = await saveNotificationType({
    id,
    partnerId,
    userId,
    payload,
  })

  if (result instanceof Boom.Boom) return result

  const { ok, notificationTypeId, error } = result
  if (!ok) {
    return Boom.internal(`Can not save notification: ${error}`)
  }

  return { ok: true, notificationTypeId }
}

module.exports = {
  listNotifications,
  getNotifications,
  getNotification,
  createNotifications,
  shouldNotify,
  resultConditionsMet,
  getPeopleToNotify,
  saveNotification,
  deleteNotification,
  saveStatusNotification,
}
