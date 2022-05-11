const Promise = require('bluebird')
const _ = require('lodash')
const bcrypt = require('bcrypt')
const { readJson } = require('fs-extra')
const path = require('path')
const { addMilliseconds, subDays, addMinutes, format } = require('date-fns')
const relativeObjectsSeeds = require('./relativeObjectsSeeds')
const { getBaseIssues } = require('./relatedObjects/issues')
const {
  allAssayTypeToId,
  assayToId,
  diseaseToId,
  formTypeToId,
  allResultCategoryToId,
  issueTypeToId,
  allJobFunctionToId,
} = require('../src/shared/dictionary')
const logger = require('../src/shared/logger')
const config = require('../src/config')

const saltRounds = parseInt(config.passwordSaltRounds, 10)

const tables = [
  'DeviceApiRawStatus',
  'FormType',
  'Disease',
  'AssayType',
  'FileContentType',
  'IssueCategory',
  'IssueEventStatus',
  'IssueStatusSeverity',
  ['IssueStatus', seedStaticDataIssueStatus],
  'MessageStatus',
  'MessageSeverity',
  'ResultCategory',
  'ResultSource',
  'ResultStatus',
  'ResultType',
  'ResultTreatmentStatus',
  'ResultWorkflowStatus',
  'SampleType',
  'FollowUpType',
  'ResultNoteType',
  // TODO ASP-757 Standardize static data key on externalId
  ['ConsumableReason', 'name'],
  ['DeviceApproval', 'token'],
  ['PartnerType', 'name'],
  ['DeviceTypeCategory', 'name'],
  ['Unit', 'name'],
  ['Permission', seedStaticDataPermission],
  ['TimeZone', 'id'],
  'DeviceMaintenanceStatus',
  'NotificationTypeCategory',
]

const uniqueKeys = {
  NotificationType: [
    'partnerId',
    'name',
    'issueTypeId',
    'jobFunctionId',
    'level',
    'messageTypeId',
  ],
  IssueEventTrigger: ['issueTypeId', 'partnerId', 'issueEventStatusId'],
  IssueResolutionTrigger: ['issueTypeId', 'partnerId'],
  IssueEscalationTrigger: ['issueTypeId', 'partnerId', 'escalateToLevel'],
  MessageType: [
    'messageSeverityId',
    'alertTemplateId',
    'smsTemplateId',
    'emailTemplateId',
    'webhookTemplateId',
    'pushNotificationTemplateId',
  ],
  IssueType: ['externalId'],
}

const foreignKeys = {
  NotificationType: [
    { column: 'partnerId', reference: 'Partner.id' },
    { column: 'issueTypeId', reference: 'IssueType.id' },
    { column: 'messageTypeId', reference: 'MessageType.id' },
  ],
  IssueResolutionTrigger: [
    { column: 'partnerId', reference: 'Partner.id' },
    { column: 'issueTypeId', reference: 'IssueType.id' },
  ],
  IssueEscalationTrigger: [
    { column: 'partnerId', reference: 'Partner.id' },
    { column: 'issueTypeId', reference: 'IssueType.id' },
  ],
  MessageType: [
    { column: 'messageSeverityId', reference: 'MessageSeverity.id' },
    { column: 'alertTemplateId', reference: 'AlertTemplate.id' },
    { column: 'smsTemplateId', reference: 'SmsTemplate.id' },
    { column: 'emailTemplateId', reference: 'EmailTemplate.id' },
    { column: 'pushNotificationId', reference: 'PushNotification.id' },
  ],
}

// Helper for seed files. Ru
let hasSeededStaticData = false
let commonInserts = false

// Set up the file name of the seed with __filename.
function seed(seed, fileName, overridedSeeds) {
  return {
    seed(knex) {
      return runSeed(seed, knex, fileName, overridedSeeds).catch(err => {
        logger.error(err)
        throw err
      })
    },
  }
}

async function runSeed(seed, knex, fileName, overridedSeeds) {
  const seedsRun = await getSeedsRan(knex)
  if (!hasSeededStaticData) {
    await seedStaticData(knex, overridedSeeds)
    hasSeededStaticData = true
  }
  if (fileName) {
    fileName = path.relative(__filename, fileName).slice(3).replace(/\\/g, '/')
    if (!seedsRun || !seedsRun[fileName]) {
      return seed(knex)
        .catch(async e => {
          await knex('AspectSeed').insert({
            fileName,
            success: false,
            errorMessage: e.message,
          })
          throw e
        })
        .then(async () => {
          if (!commonInserts) {
            commonInserts = true
            await Promise.each(
              Object.keys(relativeObjectsSeeds),
              async elem => {
                commonInserts =
                  commonInserts && (await relativeObjectsSeeds[elem](knex))
              }
            )
          }
          await knex('AspectSeed').insert({
            fileName,
            success: true,
          })
        })
    }
  }
}

async function rowsAsObject(knex, table, column = 'name') {
  return knex(table).then(items =>
    items.reduce((memo, row) => {
      memo[row[column]] = row
      return memo
    }, {})
  )
}

async function getDefaultMessageTypes(knex) {
  return knex('MessageType as mt')
    .join('IssueType as it', 'it.defaultMessageTypeId', 'mt.id')
    .select('it.externalId as issueTypeExternalId', 'mt.*')
    .then(items =>
      items.reduce((memo, row) => {
        memo[row.issueTypeExternalId] = row
        return memo
      }, {})
    )
}

// -------------------------------------------------------
// seedStockIssuesUpdate
// -------------------------------------------------------
async function seedStockIssuesUpdate(knex, partnerName) {
  const { id: partnerId } = await knex('Partner')
    .where({ name: partnerName })
    .first()

  const now = new Date()
  const issueTypes = await rowsAsObject(knex, 'IssueType', 'externalId')

  // -------------------------------------------
  // Issue Escalation Triggers
  // -------------------------------------------
  await knex('IssueEscalationTrigger')
    .update({
      escalationConditions: JSON.stringify({
        evaluationMethod: 'plugin-function',
        evaluationParameter: 'escalateIssueStockout', // see /plugin/partner/Myanmar/issueEscalations.js
      }),
      updatedOn: now,
    })
    .where({
      issueTypeId: issueTypes.InventoryStockout.id,
      partnerId,
      escalateToLevel: 2,
    })
    .whereRaw('escalationConditions->>"$.evaluationMethod" = "issue-age"')
}

// -------------------------------------------------------
// seedStockIssues
// -------------------------------------------------------
async function seedStockIssues(knex) {
  await knex('Partner').update({
    dueDaysInventoryStockout: 30,
    dueDaysInventoryStockExpiring: 30,
  })

  const { id: partnerId } = await knex('Partner')
    .where({ name: 'Myanmar' })
    .first()

  const now = new Date()
  const auditFields = {
    createdOn: now,
    updatedOn: now,
  }

  // Reuse previously seeded "static" data
  const [issueCategories, messageSeverities] = await Promise.all([
    rowsAsObject(knex, 'IssueCategory', 'externalId'),
    rowsAsObject(knex, 'MessageSeverity', 'externalId'),
  ])

  // ---------------------------------
  // Inventory Stockout Issue
  // ---------------------------------
  const [stockoutAlertTemplateId] = await knex('AlertTemplate').insert({
    message: 'Stock-out expected {{formatDate issue.data.date}} - Order Stock.',
    ...auditFields,
  })

  const [stockoutSmsTemplateId] = await knex('SmsTemplate').insert({
    message:
      '{{site.name}}: Stock-out expected {{formatDate issue.data.date}} - Order Stock.',
    ...auditFields,
  })

  const [stockoutEmailTemplateId] = await knex('EmailTemplate').insert({
    subject: '{{site.name}} stockout',
    body: '{{site.name}}: Stock-out expected {{formatDate issue.data.date}} - Order Stock.',
    htmlBody:
      '<em>{{site.name}}:</em> Stock-out expected {{formatDate issue.data.date}} - Order Stock.',
    ...auditFields,
  })

  // ---------------------------------
  // Inventory Stock Expiring Issue
  // ---------------------------------
  const messageStockExpiring =
    '{{issue.data.totalWasted}} consumables likely to expire.'
  const [stockExpiringAlertTemplateId] = await knex('AlertTemplate').insert({
    message: messageStockExpiring,
    ...auditFields,
  })

  const [stockExpiringSmsTemplateId] = await knex('SmsTemplate').insert({
    message: messageStockExpiring,
    ...auditFields,
  })

  const [stockExpiringEmailTemplateId] = await knex('EmailTemplate').insert({
    subject: 'stock expiring at {{site.name}}',
    body: messageStockExpiring,
    htmlBody: messageStockExpiring,
    ...auditFields,
  })

  const { id: stockoutMessageTypeId } = await upsertSingle(
    knex,
    'MessageType',
    {
      messageSeverityId: messageSeverities.Alert.id,
      alertTemplateId: stockoutAlertTemplateId,
      smsTemplateId: stockoutSmsTemplateId,
      emailTemplateId: stockoutEmailTemplateId,
    }
  )
  const { id: stockExpiringMessageTypeId } = await upsertSingle(
    knex,
    'MessageType',
    {
      messageSeverityId: messageSeverities.Alert.id,
      alertTemplateId: stockExpiringAlertTemplateId,
      smsTemplateId: stockExpiringSmsTemplateId,
      emailTemplateId: stockExpiringEmailTemplateId,
    }
  )

  await upsertItems(knex, 'IssueType', uniqueKeys.IssueType, [
    {
      name: 'Inventory Stockout',
      externalId: 'InventoryStockout',
      i18nKey: 'issueStatusInventoryStockout',
      issueCategoryId: issueCategories.ReagentHealth.id,
      defaultMessageTypeId: stockoutMessageTypeId,
    },
    {
      name: 'Inventory Stock Expiring',
      externalId: 'InventoryStockExpiring',
      i18nKey: 'issueStatusInventoryStockExpiring',
      issueCategoryId: issueCategories.ReagentHealth.id,
      defaultMessageTypeId: stockExpiringMessageTypeId,
    },
  ])

  const [issueTypes, defaultMessageTypes] = await Promise.all([
    rowsAsObject(knex, 'IssueType', 'externalId'),
    getDefaultMessageTypes(knex),
  ])

  const { id: jobFunctionIdRegionalOfficer } = await knex('JobFunction')
    .where({
      name: 'Regional Officer',
      partnerId,
    })
    .first()

  const { id: jobFunctionIdLabUser } = await knex('JobFunction')
    .where({
      name: 'Lab User',
      partnerId,
    })
    .first()

  // -------------------------------------------
  // Notifications
  // -------------------------------------------
  await upsertNotificationTypes(knex, [
    // ------------
    // Stockout
    // ------------
    {
      name: 'LU Stockout',
      partnerId,
      issueTypeId: issueTypes.InventoryStockout.id,
      jobFunctionId: jobFunctionIdLabUser,
      level: 1,
      canAcknowledge: 1,
      messageTypeId: defaultMessageTypes.InventoryStockout.id,
      ...auditFields,
    },
    {
      name: 'LU Escalated Stockout',
      partnerId,
      issueTypeId: issueTypes.InventoryStockout.id,
      jobFunctionId: jobFunctionIdLabUser,
      level: 2,
      canAcknowledge: 0,
      messageTypeId: defaultMessageTypes.InventoryStockout.id,
      ...auditFields,
    },
    {
      name: 'LU Stockout - RO View',
      partnerId,
      issueTypeId: issueTypes.InventoryStockout.id,
      jobFunctionId: jobFunctionIdRegionalOfficer,
      level: 1,
      canAcknowledge: 0,
      messageTypeId: defaultMessageTypes.InventoryStockout.id,
      ...auditFields,
    },
    {
      name: 'LU Escalated Stockout - RO View',
      partnerId,
      issueTypeId: issueTypes.InventoryStockout.id,
      jobFunctionId: jobFunctionIdRegionalOfficer,
      level: 2,
      canAcknowledge: 0,
      messageTypeId: defaultMessageTypes.InventoryStockout.id,
      ...auditFields,
    },
    {
      name: 'RO Stockout',
      partnerId,
      issueTypeId: issueTypes.InventoryStockout.id,
      jobFunctionId: jobFunctionIdRegionalOfficer,
      level: 1,
      canAcknowledge: 1,
      messageTypeId: defaultMessageTypes.InventoryStockout.id,
      ...auditFields,
    },
    // ------------
    // StockExpiring
    // ------------
    {
      name: 'LU Stock Expiring',
      partnerId,
      issueTypeId: issueTypes.InventoryStockExpiring.id,
      jobFunctionId: jobFunctionIdLabUser,
      level: 1,
      canAcknowledge: 1,
      messageTypeId: defaultMessageTypes.InventoryStockExpiring.id,
      ...auditFields,
    },
    {
      name: 'LU Escalated Stock Expiring',
      partnerId,
      issueTypeId: issueTypes.InventoryStockExpiring.id,
      jobFunctionId: jobFunctionIdLabUser,
      level: 2,
      canAcknowledge: 0,
      messageTypeId: defaultMessageTypes.InventoryStockExpiring.id,
      ...auditFields,
    },
    {
      name: 'LU Stock Expiring - RO View',
      partnerId,
      issueTypeId: issueTypes.InventoryStockExpiring.id,
      jobFunctionId: jobFunctionIdRegionalOfficer,
      level: 1,
      canAcknowledge: 0,
      messageTypeId: defaultMessageTypes.InventoryStockExpiring.id,
      ...auditFields,
    },
    {
      name: 'LU Escalated Stock Expiring - RO View',
      partnerId,
      issueTypeId: issueTypes.InventoryStockExpiring.id,
      jobFunctionId: jobFunctionIdRegionalOfficer,
      level: 2,
      canAcknowledge: 0,
      messageTypeId: defaultMessageTypes.InventoryStockExpiring.id,
      ...auditFields,
    },
    {
      name: 'RO Stock Expiring',
      partnerId,
      issueTypeId: issueTypes.InventoryStockExpiring.id,
      jobFunctionId: jobFunctionIdRegionalOfficer,
      level: 1,
      canAcknowledge: 0,
      messageTypeId: defaultMessageTypes.InventoryStockExpiring.id,
      ...auditFields,
    },
  ])

  // -------------------------------------------
  // Issue Escalation Triggers
  // -------------------------------------------
  await upsertIssueEscalationTrigger(knex, [
    // ------------
    // Inventory Stockout escalation
    // ------------
    {
      issueTypeId: issueTypes.InventoryStockout.id,
      partnerId,
      escalateToLevel: 2,
      escalationConditions: JSON.stringify({
        evaluationMethod: 'issue-age',
        evaluationParameter: { days: 10 }, // in 10 days after issue started
      }),
      createdOn: now,
      updatedOn: now,
    },
    {
      issueTypeId: issueTypes.InventoryStockout.id,
      partnerId,
      escalateToLevel: 3,
      escalationConditions: JSON.stringify({
        evaluationMethod: 'issue-age',
        evaluationParameter: { days: 20 }, // in 20 days after issue started
      }),
      createdOn: now,
      updatedOn: now,
    },
    // ------------
    // Inventory Stock Expiring escalation
    // ------------
    {
      issueTypeId: issueTypes.InventoryStockExpiring.id,
      partnerId,
      escalateToLevel: 2,
      escalationConditions: JSON.stringify({
        evaluationMethod: 'issue-age',
        evaluationParameter: { days: 10 }, // in 10 days after issue started
      }),
      createdOn: now,
      updatedOn: now,
    },
    {
      issueTypeId: issueTypes.InventoryStockExpiring.id,
      partnerId,
      escalateToLevel: 3,
      escalationConditions: JSON.stringify({
        evaluationMethod: 'issue-age',
        evaluationParameter: { days: 20 }, // in 20 days after issue started
      }),
      createdOn: now,
      updatedOn: now,
    },
  ])
}

async function getPermissionModules(knex) {
  return knex('Permission').then(items =>
    items.reduce((memo, row) => {
      if (!memo[row.module]) {
        memo[row.module] = {}
      }
      memo[row.module][row.activity] = row.id
      return memo
    }, {})
  )
}

async function getSeedsFolder(table, overridedSeeds) {
  //  Look for overrided fixture. If exists, sets the seedsFolder (country folder)
  let folder = ''
  let i = 0
  while (i < overridedSeeds.staticDataFiles.length && folder === '') {
    const overridedTable = overridedSeeds.staticDataFiles[i]
    if (table === overridedTable) {
      folder = overridedSeeds.seedsFolder
      overridedSeeds.staticDataFiles.splice(i)
    }
    i += 1
  }
  return folder
}

async function seedTable(
  knex,
  fixtureItem,
  overridedSeeds = { seedsFolder: null, staticDataFiles: [] }
) {
  const table = _.isArray(fixtureItem) ? fixtureItem[0] : fixtureItem
  const keyColumn = _.isArray(fixtureItem) ? fixtureItem[1] : 'externalId'
  const seedsFolder = await getSeedsFolder(table, overridedSeeds)

  const fixturePath = `./seeds/${
    seedsFolder && seedsFolder !== '' ? `${seedsFolder}/` : ''
  }fixtures/${table}.json`

  const fixture = await readJson(fixturePath)
  if (_.isFunction(keyColumn)) {
    await keyColumn(knex, fixture)
  } else {
    await Promise.each(fixture.data || [], async datum => {
      const existingDatum = await knex(table)
        .where(keyColumn, datum[keyColumn])
        .first('id')
      if (existingDatum == null) {
        const elementToInsert = _.reduce(
          _.keys(datum),
          (result, key) => {
            result[key] = _.isObject(datum[key])
              ? JSON.stringify(datum[key])
              : datum[key]
            return result
          },
          {}
        )
        await knex(table).insert(elementToInsert)
      }
    })
    await Promise.each(fixture.relationships || [], async relationship => {
      const updates = {}
      const existingDatum = await knex(table)
        .where(_.pick(relationship, [keyColumn]))
        .first()
      await Promise.each(
        Object.keys(_.omit(relationship, [keyColumn])),
        async foreignKeyColumnName => {
          const foreignKey = relationship[foreignKeyColumnName]
          const existingRelatedDatum =
            (await knex(foreignKey.table)
              .where(_.omit(foreignKey, ['table']))
              .first('id')) || {}
          if (
            existingDatum[foreignKeyColumnName] !== existingRelatedDatum.id &&
            typeof existingRelatedDatum.id !== 'undefined'
          ) {
            updates[foreignKeyColumnName] = existingRelatedDatum.id
          }
        }
      )
      if (!_.isEmpty(updates)) {
        await knex(table)
          .where(_.pick(relationship, [keyColumn]))
          .update(updates)
      }
    })
  }
}

async function warnNotExistingOverridedSeeds(overridedSeeds) {
  for (const fileName of overridedSeeds.staticDataFiles) {
    // eslint-disable-next-line no-console
    console.warn(
      `IMPORTANT! The overrided file '${fileName}' doesn't exist. Please, make sure that the file name is correct.`
    )
  }
}

async function seedStaticData(
  knex,
  overridedSeeds = { seedsFolder: null, staticDataFiles: [] }
) {
  for (const tableItem of tables) {
    // eslint-disable-next-line no-await-in-loop
    await seedTable(knex, tableItem, overridedSeeds)
  }

  await warnNotExistingOverridedSeeds(overridedSeeds)
}

async function seedStaticDataIssueStatus(knex, { data }) {
  const severities = await rowsAsObject(
    knex,
    'IssueStatusSeverity',
    'externalId'
  )
  for (const status of data) {
    /* eslint-disable no-await-in-loop */
    const existingStatus = await knex('IssueStatus')
      .where('externalId', status.externalId)
      .first('id')
    if (existingStatus == null) {
      await knex('IssueStatus').insert({
        ..._.omit(status, ['issueStatusSeverity']),
        issueStatusSeverityId: severities[status.issueStatusSeverity].id,
      })
    }
  }
}

async function seedStaticDataPermission(knex, { modules }) {
  for (const { name: module, activities } of modules) {
    /* eslint-disable no-await-in-loop */
    for (const activity of activities) {
      const permission = { module, activity }
      const existingPermission = await knex('Permission')
        .where(permission)
        .first('id')
      if (existingPermission == null) {
        await knex('Permission').insert(permission)
      }
    }
  }
}

async function addFollowUps(
  knex,
  fixture,
  partnerIds = [],
  assaysWhitelist = []
) {
  let { data } = fixture

  if (!partnerIds || partnerIds.length === 0)
    partnerIds = await knex('Partner').pluck('id')

  const assaysDb = await knex('Assay')
    .modify(queryBuilder => {
      if (!assaysWhitelist || assaysWhitelist.length > 0)
        queryBuilder.whereIn('externalId', assaysWhitelist)
    })
    .select('id', 'externalId')

  if (assaysWhitelist.length === 0)
    assaysWhitelist = assaysDb.map(a => a.externalId)

  // Re-set as data all the follow ups that contains any whitelisted assays
  data = data.filter(followUp =>
    followUp.assays.filter(
      assayExternalId =>
        assaysDb.map(a => a.externalId).includes(assayExternalId).length > 0
    )
  )

  const typesDb = await knex('FollowUpType').select('id', 'externalId')
  for (const { type, name, externalId, i18nKey, assays } of data) {
    const { id: followUpTypeId } = _.find(typesDb, { externalId: type })
    const followUp = { followUpTypeId, name, externalId, i18nKey }
    const existingFollowUp = await knex('FollowUp').where(followUp).first('id')
    let followUpId = null
    if (existingFollowUp == null) {
      ;[followUpId] = await knex('FollowUp').insert(followUp)
    } else {
      followUpId = existingFollowUp.id
    }

    /* eslint-disable no-await-in-loop */
    for (const partnerId of partnerIds) {
      if (assays && assays.length > 0) {
        for (const assay of assays) {
          const assayDb = _.find(assaysDb, { externalId: assay })
          if (!assayDb) continue // eslint-disable-line no-continue
          const followUpAssay = {
            partnerId,
            followUpId,
            assayId: assayDb.id,
          }
          const existingFollowUpAssay = await knex('FollowUpAssay')
            .where(followUpAssay)
            .whereNull('resultCategory1')
            .whereNull('resultCategory2')
            .first('assayId')
          if (existingFollowUpAssay == null) {
            await knex('FollowUpAssay').insert(followUpAssay)
          }
        }
      } else {
        const followUpAssay = {
          partnerId,
          followUpId,
        }
        const existingFollowUpAssay = await knex('FollowUpAssay')
          .where(followUpAssay)
          .whereNull('assayId')
          .whereNull('resultCategory1')
          .whereNull('resultCategory2')
          .first('assayId')
        if (existingFollowUpAssay == null) {
          await knex('FollowUpAssay').insert(followUpAssay)
        }
      }
    }
  }
}

async function removeFollowUps(knex, partnerIds, externalId = 'moved') {
  const followUp = await knex('FollowUp')
    .select('id')
    .where('externalId', externalId)
    .first()
  if (followUp) {
    for (const partnerId of partnerIds) {
      await knex('FollowUpAssay')
        .where({
          followUpId: followUp.id,
          partnerId,
        })
        .del()
    }

    await knex('ResultFollowUp')
      .where({
        followUpId: followUp.id,
      })
      .del()

    await knex('FollowUp')
      .where({
        id: followUp.id,
      })
      .del()
  }
}

// Ensures all common triggers for the given partner are set based on notification
// types triggered for that partner. This will only seed for triggers that do
// not already exist for given partner, issue type, and issue event status, so
// it can be called multiple times, and can be called after seeding custom triggers
// Issue types in optional blacklist will never be included (unless in whitelist)
// Issue types in optional whitelist will always be included.
async function seedIssueEventTriggersForPartner(
  knex,
  partnerId,
  { issueTypeBlacklist = [], issueTypeWhitelist = [] } = {}
) {
  const now = new Date()
  const { data } = await readJson('./seeds/fixtures/IssueEventTrigger.json')
  const [issueTypes, issueEventStatuses] = await Promise.all([
    rowsAsObject(knex, 'IssueType', 'externalId'),
    rowsAsObject(knex, 'IssueEventStatus', 'externalId'),
  ])

  const issueTypeConfigured = await knex('NotificationType as nt')
    .join('IssueType as it', 'it.id', 'nt.issueTypeId')
    .where({ 'nt.partnerId': partnerId })
    .orderBy('it.externalId')
    .distinct('it.externalId as issueType')
    .then(items =>
      items.reduce((memo, { issueType }) => {
        if (!issueTypeBlacklist.includes(issueType)) {
          memo[issueType] = true
        }
        return memo
      }, {})
    )
  issueTypeWhitelist.forEach(issueType => {
    issueTypeConfigured[issueType] = true
  })

  await Promise.each(
    data,
    async ({
      issueType,
      issueEventStatus,
      triggerConditions,
      filterIssueCondition = null,
    }) => {
      if (issueTypeConfigured[issueType] && issueTypes[issueType]) {
        const triggerData = {
          partnerId,
          issueTypeId: issueTypes[issueType].id,
          issueEventStatusId: issueEventStatuses[issueEventStatus].id,
        }
        const existingTrigger = await knex('IssueEventTrigger')
          .where({
            ...triggerData,
          })
          .where(function () {
            if (triggerConditions && triggerConditions.length > 1) {
              this.whereRaw(
                "JSON_CONTAINS(triggerConditions, '?')",
                triggerConditions
              )
            }
            if (filterIssueCondition && filterIssueCondition.length > 1) {
              this.whereRaw(
                "JSON_CONTAINS(filterIssueCondition, '?')",
                filterIssueCondition
              )
            }
          })
          .first('id')
        if (existingTrigger == null) {
          await upsertSingle(
            knex,
            'IssueEventTrigger',
            uniqueKeys.IssueEventTrigger,
            {
              ...triggerData,
              triggerConditions: JSON.stringify(triggerConditions),
              filterIssueCondition: JSON.stringify(filterIssueCondition),
              createdOn: now,
              updatedOn: now,
            }
          )
        }
      }
    }
  )
}

// Ensures all escalation triggers for the given partner.
// This will only seed for escalation triggers that do
// not already exist for given partner issue type, and level so
// it can be called multiple times, and can be called after seeding custom triggers
async function seedIssueEscalationTriggersForPartner(
  knex,
  partnerId,
  identifiers = []
) {
  const now = new Date()

  // get escalation triggers limited by the identifiers
  const { data } = await readJson(
    './seeds/fixtures/IssueEscalationTrigger.json'
  )

  const [issueTypes] = await Promise.all([
    rowsAsObject(knex, 'IssueType', 'externalId'),
  ])

  await Promise.each(
    data,
    async ({
      identifier,
      issueType,
      escalateToLevel,
      escalationConditions,
    }) => {
      // only try to insert/update if the issue type exists
      if (identifiers.indexOf(identifier) >= 0 && issueTypes[issueType]) {
        const triggerData = {
          partnerId,
          issueTypeId: issueTypes[issueType].id,
          escalateToLevel,
        }

        await upsertSingle(
          knex,
          'IssueEscalationTrigger',
          uniqueKeys.IssueEscalationTrigger,
          {
            ...triggerData,
            escalationConditions: JSON.stringify(escalationConditions),
            createdOn: now,
            updatedOn: now,
          }
        )
      }
    }
  )
}

// ***********************************************************************
// 'whereKeys' is a string with single field name or array with field names
async function upsertItems(
  knex,
  tableName,
  whereKeys,
  items,
  allowInserts = true
) {
  if (typeof whereKeys === 'string') {
    whereKeys = [whereKeys]
  }
  if (!_.isArray(items)) {
    items = [items]
  }
  // ---------------------
  // helper functions whereKeys
  const findItem = (dbItems, itemToFind, whereKeys) =>
    dbItems.find(dbItem => {
      let found = true
      whereKeys.forEach(key => {
        found = found && dbItem[key] === itemToFind[key]
      })
      return found
    })
  const getWhereItem = (item, whereKeys) => {
    const whereItem = {}
    whereKeys.forEach(key => {
      whereItem[key] = item[key]
    })
    return whereItem
  }
  // ---------------------
  // get from db items with specified whereKeys
  const existingItems = await knex(tableName)
    .where(function () {
      items.forEach(item => {
        this.orWhere(getWhereItem(item, whereKeys))
      })
    })
    .select(...whereKeys)

  if (allowInserts) {
    // ---------------------
    // insert missing items
    const itemsToInsert = items.filter(
      item => !findItem(existingItems, item, whereKeys)
    )
    if (itemsToInsert.length) {
      await knex(tableName).insert(itemsToInsert)
    }
  }
  // ---------------------
  // update existing items
  const itemsToUpdate = items.filter(item =>
    findItem(existingItems, item, whereKeys)
  )
  if (itemsToUpdate.length) {
    const queries = []
    itemsToUpdate.forEach(item => {
      if (!_.isEmpty(item)) {
        const query = knex(tableName)
          .where(getWhereItem(item, whereKeys))
          .update(item)
        queries.push(query)
      }
    })
    if (!_.isEmpty(queries)) {
      await Promise.all(queries)
    }
  }
}

// ***********************************************************************
async function upsertSingle(knex, tableName, whereClause, item) {
  if (typeof whereClause === 'string') {
    // single field name which is a primary or unique key, 'item' is required param
    const fieldKey = whereClause
    whereClause = { [fieldKey]: item[fieldKey] }
  } else if (_.isArray(whereClause)) {
    // when whereClause is an array of field names then 'item' is required param
    const fields = whereClause
    whereClause = builder => {
      fields.forEach(name => {
        if (item[name] === null) {
          builder.whereNull(name)
        } else if (item[name] === undefined) {
          // skip this field because it is missing in 'item'
        } else {
          builder.where(name, item[name])
        }
      })
    }
  } else {
    // 'whereClause' is json, if 'item' is missing set it to 'whereClause'
    item = item || whereClause
  }
  const q = knex(tableName).where(whereClause)
  const existingItem = await q.clone().first()
  if (!_.isEmpty(item)) {
    if (existingItem) {
      await q.clone().update(item)
    } else {
      await knex(tableName).insert(item)
    }
  }
  return q.first()
}

// ***********************************************************************
async function upsertNotificationTypes(knex, items) {
  await upsertItems(
    knex,
    'NotificationType', // tableName
    uniqueKeys.NotificationType, // whereKeys
    items
  )
}

// ***********************************************************************
async function seedNotificationTypes(
  knex,
  {
    partnerId,
    jobFunctionIds: { jobFunctionIdLabUser, jobFunctionIdRegionalOfficer },
    auditFields,
  }
) {
  const issueTypes = await rowsAsObject(knex, 'IssueType', 'externalId')
  const defaultMessageTypes = await getDefaultMessageTypes(knex)
  await upsertNotificationTypes(knex, [
    {
      name: 'LU Network',
      partnerId,
      issueTypeId: issueTypes.DeviceOffline.id,
      jobFunctionId: jobFunctionIdLabUser,
      level: 1,
      canAcknowledge: 1,
      messageTypeId: defaultMessageTypes.DeviceOffline.id,
      ...auditFields,
    },
    {
      name: 'RO Network',
      partnerId,
      issueTypeId: issueTypes.DeviceOffline.id,
      jobFunctionId: jobFunctionIdRegionalOfficer,
      level: 2,
      canAcknowledge: 1,
      messageTypeId: defaultMessageTypes.DeviceOffline.id,
      ...auditFields,
    },
    {
      name: 'RO Escalated Network',
      partnerId,
      issueTypeId: issueTypes.DeviceOffline.id,
      jobFunctionId: jobFunctionIdRegionalOfficer,
      level: 3,
      canAcknowledge: 0,
      messageTypeId: defaultMessageTypes.DeviceOffline.id,
      ...auditFields,
    },
    {
      name: 'LU No Testing',
      partnerId,
      issueTypeId: issueTypes.DeviceNoResults.id,
      jobFunctionId: jobFunctionIdLabUser,
      level: 1,
      canAcknowledge: 1,
      messageTypeId: defaultMessageTypes.DeviceNoResults.id,
      ...auditFields,
    },
    {
      name: 'RO No Testing',
      partnerId,
      issueTypeId: issueTypes.DeviceNoResults.id,
      jobFunctionId: jobFunctionIdRegionalOfficer,
      level: 2,
      canAcknowledge: 1,
      messageTypeId: defaultMessageTypes.DeviceNoResults.id,
      ...auditFields,
    },
    {
      name: 'RO Escalated No Testing',
      partnerId,
      issueTypeId: issueTypes.DeviceNoResults.id,
      jobFunctionId: jobFunctionIdRegionalOfficer,
      level: 3,
      canAcknowledge: 0,
      messageTypeId: defaultMessageTypes.DeviceNoResults.id,
      ...auditFields,
    },
    {
      name: 'LU Module Failure',
      partnerId,
      issueTypeId: issueTypes.ModuleFailureError.id,
      jobFunctionId: jobFunctionIdLabUser,
      level: 2,
      canAcknowledge: 1,
      messageTypeId: defaultMessageTypes.ModuleFailureError.id,
      ...auditFields,
    },
    {
      name: 'LU Escalated Module Failure',
      partnerId,
      issueTypeId: issueTypes.ModuleFailureError.id,
      jobFunctionId: jobFunctionIdLabUser,
      level: 2,
      canAcknowledge: 0,
      messageTypeId: defaultMessageTypes.ModuleFailureError.id,
      ...auditFields,
    },
    {
      name: 'LU Module Temperature',
      partnerId,
      issueTypeId: issueTypes.ModuleTemperatureError.id,
      jobFunctionId: jobFunctionIdLabUser,
      level: 1,
      canAcknowledge: 1,
      messageTypeId: defaultMessageTypes.ModuleTemperatureError.id,
      ...auditFields,
    },
    {
      name: 'LU Escalated Module Temperature',
      partnerId,
      issueTypeId: issueTypes.ModuleTemperatureError.id,
      jobFunctionId: jobFunctionIdLabUser,
      level: 2,
      canAcknowledge: 0,
      messageTypeId: defaultMessageTypes.ModuleTemperatureError.id,
      ...auditFields,
    },
    {
      name: 'LU Module Power',
      partnerId,
      issueTypeId: issueTypes.ModulePowerError.id,
      jobFunctionId: jobFunctionIdLabUser,
      level: 1,
      canAcknowledge: 1,
      messageTypeId: defaultMessageTypes.ModulePowerError.id,
      ...auditFields,
    },
    {
      name: 'LU Escalated Module Power',
      partnerId,
      issueTypeId: issueTypes.ModulePowerError.id,
      jobFunctionId: jobFunctionIdLabUser,
      level: 2,
      canAcknowledge: 0,
      messageTypeId: defaultMessageTypes.ModulePowerError.id,
      ...auditFields,
    },
    {
      name: 'LU Machine Temperature',
      partnerId,
      issueTypeId: issueTypes.MachineTemperatureError.id,
      jobFunctionId: jobFunctionIdLabUser,
      level: 1,
      canAcknowledge: 1,
      messageTypeId: defaultMessageTypes.MachineTemperatureError.id,
      ...auditFields,
    },
    {
      name: 'LU Escalated Machine Temperature',
      partnerId,
      issueTypeId: issueTypes.MachineTemperatureError.id,
      jobFunctionId: jobFunctionIdLabUser,
      level: 2,
      canAcknowledge: 0,
      messageTypeId: defaultMessageTypes.MachineTemperatureError.id,
      ...auditFields,
    },
    {
      name: 'LU Machine Power',
      partnerId,
      issueTypeId: issueTypes.MachinePowerError.id,
      jobFunctionId: jobFunctionIdLabUser,
      level: 1,
      canAcknowledge: 1,
      messageTypeId: defaultMessageTypes.MachinePowerError.id,
      ...auditFields,
    },
    {
      name: 'LU Escalated Machine Power',
      partnerId,
      issueTypeId: issueTypes.MachinePowerError.id,
      jobFunctionId: jobFunctionIdLabUser,
      level: 2,
      canAcknowledge: 0,
      messageTypeId: defaultMessageTypes.MachinePowerError.id,
      ...auditFields,
    },
    {
      name: 'LU Module Procedural',
      partnerId,
      issueTypeId: issueTypes.ModuleProceduralError.id,
      jobFunctionId: jobFunctionIdLabUser,
      level: 1,
      canAcknowledge: 1,
      messageTypeId: defaultMessageTypes.ModuleProceduralError.id,
      ...auditFields,
    },
    {
      name: 'LU Escalated Module Procedural',
      partnerId,
      issueTypeId: issueTypes.ModuleProceduralError.id,
      jobFunctionId: jobFunctionIdLabUser,
      level: 2,
      canAcknowledge: 0,
      messageTypeId: defaultMessageTypes.ModuleProceduralError.id,
      ...auditFields,
    },
    {
      name: 'LU Machine Procedural',
      partnerId,
      issueTypeId: issueTypes.MachineProceduralError.id,
      jobFunctionId: jobFunctionIdLabUser,
      level: 1,
      canAcknowledge: 1,
      messageTypeId: defaultMessageTypes.MachineProceduralError.id,
      ...auditFields,
    },
    {
      name: 'LU Escalated Machine Procedural',
      partnerId,
      issueTypeId: issueTypes.MachineProceduralError.id,
      jobFunctionId: jobFunctionIdLabUser,
      level: 2,
      canAcknowledge: 0,
      messageTypeId: defaultMessageTypes.MachineProceduralError.id,
      ...auditFields,
    },
    {
      name: 'RO Module',
      partnerId,
      issueTypeId: issueTypes.ModuleProceduralError.id,
      jobFunctionId: jobFunctionIdRegionalOfficer,
      level: 1,
      canAcknowledge: 0,
      messageTypeId: defaultMessageTypes.ModuleProceduralError.id,
      ...auditFields,
    },
    {
      name: 'RO Machine',
      partnerId,
      issueTypeId: issueTypes.MachineProceduralError.id,
      jobFunctionId: jobFunctionIdRegionalOfficer,
      level: 1,
      canAcknowledge: 0,
      messageTypeId: defaultMessageTypes.MachineProceduralError.id,
      ...auditFields,
    },
    {
      name: 'LU Reagent Health',
      partnerId,
      issueTypeId: issueTypes.ReagentHealthError.id,
      jobFunctionId: jobFunctionIdLabUser,
      level: 1,
      canAcknowledge: 1,
      messageTypeId: defaultMessageTypes.ReagentHealthError.id,
      ...auditFields,
    },
    {
      name: 'LU Escalated Reagent Health',
      partnerId,
      issueTypeId: issueTypes.ReagentHealthError.id,
      jobFunctionId: jobFunctionIdLabUser,
      level: 2,
      canAcknowledge: 0,
      messageTypeId: defaultMessageTypes.ReagentHealthError.id,
      ...auditFields,
    },
    {
      name: 'RO Reagent Health',
      partnerId,
      issueTypeId: issueTypes.ReagentHealthError.id,
      jobFunctionId: jobFunctionIdRegionalOfficer,
      level: 1,
      canAcknowledge: 0,
      messageTypeId: defaultMessageTypes.ReagentHealthError.id,
      ...auditFields,
    },
    {
      name: 'LU Stock Level Update',
      partnerId,
      issueTypeId: issueTypes.StockLevelUpdate.id,
      jobFunctionId: jobFunctionIdLabUser,
      level: 1,
      canAcknowledge: 0,
      messageTypeId: defaultMessageTypes.StockLevelUpdate.id,
      ...auditFields,
    },
    {
      name: 'RO Stock Level Update',
      partnerId,
      issueTypeId: issueTypes.StockLevelUpdate.id,
      jobFunctionId: jobFunctionIdRegionalOfficer,
      level: 1,
      canAcknowledge: 1,
      messageTypeId: defaultMessageTypes.StockLevelUpdate.id,
      ...auditFields,
    },
    {
      name: 'LU Data Category Low',
      partnerId,
      issueTypeId: issueTypes.DataCategoryLowError.id,
      jobFunctionId: jobFunctionIdLabUser,
      level: 1,
      canAcknowledge: 1,
      messageTypeId: defaultMessageTypes.DataCategoryLowError.id,
      ...auditFields,
    },
    {
      name: 'RO Data Category Low',
      partnerId,
      issueTypeId: issueTypes.DataCategoryLowError.id,
      jobFunctionId: jobFunctionIdRegionalOfficer,
      level: 1,
      canAcknowledge: 1,
      messageTypeId: defaultMessageTypes.DataCategoryLowError.id,
      ...auditFields,
    },
    {
      name: 'LU Network - RO View',
      partnerId,
      issueTypeId: issueTypes.DeviceOffline.id,
      jobFunctionId: jobFunctionIdRegionalOfficer,
      level: 1,
      canAcknowledge: 0,
      messageTypeId: defaultMessageTypes.DeviceOffline.id,
      ...auditFields,
    },
    {
      name: 'LU No Testing - RO View',
      partnerId,
      issueTypeId: issueTypes.DeviceNoResults.id,
      jobFunctionId: jobFunctionIdRegionalOfficer,
      level: 1,
      canAcknowledge: 0,
      messageTypeId: defaultMessageTypes.DeviceNoResults.id,
      ...auditFields,
    },
    {
      name: 'LU Module Failure - RO View',
      partnerId,
      issueTypeId: issueTypes.ModuleFailureError.id,
      jobFunctionId: jobFunctionIdRegionalOfficer,
      level: 2,
      canAcknowledge: 0,
      messageTypeId: defaultMessageTypes.ModuleFailureError.id,
      ...auditFields,
    },
    {
      name: 'LU Escalated Module Failure - RO View',
      partnerId,
      issueTypeId: issueTypes.ModuleFailureError.id,
      jobFunctionId: jobFunctionIdRegionalOfficer,
      level: 2,
      canAcknowledge: 0,
      messageTypeId: defaultMessageTypes.ModuleFailureError.id,
      ...auditFields,
    },
    {
      name: 'LU Module Temperature - RO View',
      partnerId,
      issueTypeId: issueTypes.ModuleTemperatureError.id,
      jobFunctionId: jobFunctionIdRegionalOfficer,
      level: 1,
      canAcknowledge: 0,
      messageTypeId: defaultMessageTypes.ModuleTemperatureError.id,
      ...auditFields,
    },
    {
      name: 'LU Escalated Module Temperature - RO View',
      partnerId,
      issueTypeId: issueTypes.ModuleTemperatureError.id,
      jobFunctionId: jobFunctionIdRegionalOfficer,
      level: 2,
      canAcknowledge: 0,
      messageTypeId: defaultMessageTypes.ModuleTemperatureError.id,
      ...auditFields,
    },
    {
      name: 'LU Module Power - RO View',
      partnerId,
      issueTypeId: issueTypes.ModulePowerError.id,
      jobFunctionId: jobFunctionIdRegionalOfficer,
      level: 1,
      canAcknowledge: 0,
      messageTypeId: defaultMessageTypes.ModulePowerError.id,
      ...auditFields,
    },
    {
      name: 'LU Escalated Module Power - RO View',
      partnerId,
      issueTypeId: issueTypes.ModulePowerError.id,
      jobFunctionId: jobFunctionIdRegionalOfficer,
      level: 2,
      canAcknowledge: 0,
      messageTypeId: defaultMessageTypes.ModulePowerError.id,
      ...auditFields,
    },
    {
      name: 'LU Machine Temperature - RO View',
      partnerId,
      issueTypeId: issueTypes.MachineTemperatureError.id,
      jobFunctionId: jobFunctionIdRegionalOfficer,
      level: 1,
      canAcknowledge: 0,
      messageTypeId: defaultMessageTypes.MachineTemperatureError.id,
      ...auditFields,
    },
    {
      name: 'LU Escalated Machine Temperature - RO View',
      partnerId,
      issueTypeId: issueTypes.MachineTemperatureError.id,
      jobFunctionId: jobFunctionIdRegionalOfficer,
      level: 2,
      canAcknowledge: 0,
      messageTypeId: defaultMessageTypes.MachineTemperatureError.id,
      ...auditFields,
    },
    {
      name: 'LU Machine Power - RO View',
      partnerId,
      issueTypeId: issueTypes.MachinePowerError.id,
      jobFunctionId: jobFunctionIdRegionalOfficer,
      level: 1,
      canAcknowledge: 0,
      messageTypeId: defaultMessageTypes.MachinePowerError.id,
      ...auditFields,
    },
    {
      name: 'LU Escalated Machine Power - RO View',
      partnerId,
      issueTypeId: issueTypes.MachinePowerError.id,
      jobFunctionId: jobFunctionIdRegionalOfficer,
      level: 2,
      canAcknowledge: 0,
      messageTypeId: defaultMessageTypes.MachinePowerError.id,
      ...auditFields,
    },
    {
      name: 'LU Module Procedural - RO View',
      partnerId,
      issueTypeId: issueTypes.ModuleProceduralError.id,
      jobFunctionId: jobFunctionIdRegionalOfficer,
      level: 1,
      canAcknowledge: 0,
      messageTypeId: defaultMessageTypes.ModuleProceduralError.id,
      ...auditFields,
    },
    {
      name: 'LU Escalated Module Procedural - RO View',
      partnerId,
      issueTypeId: issueTypes.ModuleProceduralError.id,
      jobFunctionId: jobFunctionIdRegionalOfficer,
      level: 2,
      canAcknowledge: 0,
      messageTypeId: defaultMessageTypes.ModuleProceduralError.id,
      ...auditFields,
    },
    {
      name: 'LU Machine Procedural - RO View',
      partnerId,
      issueTypeId: issueTypes.MachineProceduralError.id,
      jobFunctionId: jobFunctionIdRegionalOfficer,
      level: 1,
      canAcknowledge: 0,
      messageTypeId: defaultMessageTypes.MachineProceduralError.id,
      ...auditFields,
    },
    {
      name: 'LU Escalated Machine Procedural - RO View',
      partnerId,
      issueTypeId: issueTypes.MachineProceduralError.id,
      jobFunctionId: jobFunctionIdRegionalOfficer,
      level: 2,
      canAcknowledge: 0,
      messageTypeId: defaultMessageTypes.MachineProceduralError.id,
      ...auditFields,
    },
    {
      name: 'LU Reagent Health - RO View',
      partnerId,
      issueTypeId: issueTypes.ReagentHealthError.id,
      jobFunctionId: jobFunctionIdRegionalOfficer,
      level: 1,
      canAcknowledge: 0,
      messageTypeId: defaultMessageTypes.ReagentHealthError.id,
      ...auditFields,
    },
    {
      name: 'LU Escalated Reagent Health - RO View',
      partnerId,
      issueTypeId: issueTypes.ReagentHealthError.id,
      jobFunctionId: jobFunctionIdRegionalOfficer,
      level: 2,
      canAcknowledge: 0,
      messageTypeId: defaultMessageTypes.ReagentHealthError.id,
      ...auditFields,
    },
    {
      name: 'LU Stock Level Update - RO View',
      partnerId,
      issueTypeId: issueTypes.StockLevelUpdate.id,
      jobFunctionId: jobFunctionIdRegionalOfficer,
      level: 1,
      canAcknowledge: 0,
      messageTypeId: defaultMessageTypes.StockLevelUpdate.id,
      ...auditFields,
    },
    {
      name: 'LU Data Category Low - RO View',
      partnerId,
      issueTypeId: issueTypes.DataCategoryLowError.id,
      jobFunctionId: jobFunctionIdRegionalOfficer,
      level: 1,
      canAcknowledge: 0,
      messageTypeId: defaultMessageTypes.DataCategoryLowError.id,
      ...auditFields,
    },
  ])
}

// ***********************************************************************
async function upsertIssueEscalationTrigger(knex, items) {
  await upsertItems(
    knex,
    'IssueEscalationTrigger', // tableName
    uniqueKeys.IssueEscalationTrigger, // whereKeys
    items
  )
}

// ***********************************************************************
async function seedIssueEscalationTrigger(
  knex,
  { partnerId, pluginName, auditFields }
) {
  const issueTypes = await rowsAsObject(knex, 'IssueType', 'externalId')
  const auditDates = _.pick(auditFields, ['createdOn', 'updatedOn'])

  await upsertIssueEscalationTrigger(knex, [
    {
      issueTypeId: issueTypes.DeviceOffline.id,
      partnerId,
      escalateToLevel: 2,
      escalationConditions: JSON.stringify({
        evaluationMethod: 'issue-age',
        evaluationParameter: { days: 30 },
      }),
      ...auditDates,
    },
    {
      issueTypeId: issueTypes.DeviceOffline.id,
      partnerId,
      escalateToLevel: 3,
      escalationConditions: pluginName
        ? JSON.stringify({
            evaluationMethod: 'sql-script',
            evaluationParameter: `./src/plugin/partner/${_.upperFirst(
              pluginName
            )}/sqlScripts/shouldEscalateL2NotificationAfter30Days.sql`,
          })
        : JSON.stringify({
            evaluationMethod: 'issue-age',
            evaluationParameter: { days: 30 },
          }),
      ...auditDates,
    },
    {
      issueTypeId: issueTypes.DeviceNoResults.id,
      partnerId,
      escalateToLevel: 2,
      escalationConditions: JSON.stringify({
        evaluationMethod: 'issue-age',
        evaluationParameter: { days: 7 },
      }),
      ...auditDates,
    },
    {
      issueTypeId: issueTypes.DeviceNoResults.id,
      partnerId,
      escalateToLevel: 3,
      escalationConditions: pluginName
        ? JSON.stringify({
            evaluationMethod: 'sql-script',
            evaluationParameter: `./src/plugin/partner/${_.upperFirst(
              pluginName
            )}/sqlScripts/shouldEscalateL2NotificationAfter7Days.sql`,
          })
        : JSON.stringify({
            evaluationMethod: 'issue-age',
            evaluationParameter: { days: 7 },
          }),
      ...auditDates,
    },
    {
      issueTypeId: issueTypes.ModulePowerError.id,
      partnerId,
      escalateToLevel: 2,
      escalationConditions: JSON.stringify({
        evaluationMethod: 'issue-age',
        evaluationParameter: { days: 30 },
      }),
      ...auditDates,
    },
    {
      issueTypeId: issueTypes.ModuleTemperatureError.id,
      partnerId,
      escalateToLevel: 2,
      escalationConditions: JSON.stringify({
        evaluationMethod: 'issue-age',
        evaluationParameter: { days: 90 },
      }),
      ...auditDates,
    },
    {
      issueTypeId: issueTypes.MachineTemperatureError.id,
      partnerId,
      escalateToLevel: 2,
      escalationConditions: JSON.stringify({
        evaluationMethod: 'issue-age',
        evaluationParameter: { days: 30 },
      }),
      ...auditDates,
    },
    {
      issueTypeId: issueTypes.MachinePowerError.id,
      partnerId,
      escalateToLevel: 2,
      escalationConditions: JSON.stringify({
        evaluationMethod: 'issue-age',
        evaluationParameter: { days: 30 },
      }),
      ...auditDates,
    },
    {
      issueTypeId: issueTypes.ModuleFailureError.id,
      partnerId,
      escalateToLevel: 2,
      escalationConditions: JSON.stringify({
        evaluationMethod: 'issue-age',
        evaluationParameter: { days: 90 },
      }),
      ...auditDates,
    },
    {
      issueTypeId: issueTypes.ReagentHealthError.id,
      partnerId,
      escalateToLevel: 2,
      escalationConditions: JSON.stringify({
        evaluationMethod: 'issue-age',
        evaluationParameter: { days: 30 },
      }),
      ...auditDates,
    },
    {
      issueTypeId: issueTypes.ModuleProceduralError.id,
      partnerId,
      escalateToLevel: 2,
      escalationConditions: JSON.stringify({
        evaluationMethod: 'issue-age',
        evaluationParameter: { days: 30 },
      }),
      ...auditDates,
    },
    {
      issueTypeId: issueTypes.MachineProceduralError.id,
      partnerId,
      escalateToLevel: 2,
      escalationConditions: JSON.stringify({
        evaluationMethod: 'issue-age',
        evaluationParameter: { days: 30 },
      }),
      ...auditDates,
    },
  ])
}

// ***********************************************************************
async function upsertIssueResolutionTrigger(knex, items) {
  await upsertItems(
    knex,
    'IssueResolutionTrigger', // tableName
    uniqueKeys.IssueResolutionTrigger, // whereKeys
    items
  )
}

// ***********************************************************************
async function seedIssueResolutionTrigger(
  knex,
  { partnerId, pluginName, auditFields }
) {
  const issueTypes = await rowsAsObject(knex, 'IssueType', 'externalId')
  const auditDates = _.pick(auditFields, ['createdOn', 'updatedOn'])

  await upsertIssueResolutionTrigger(knex, [
    {
      issueTypeId: issueTypes.DeviceOffline.id,
      partnerId,
      resolutionConditions: pluginName
        ? JSON.stringify({
            evaluationMethod: 'sql-script',
            evaluationParameter: `./src/plugin/partner/${_.upperFirst(
              pluginName
            )}/sqlScripts/shouldResolveDeviceOffline.sql`,
          })
        : JSON.stringify({
            evaluationMethod: 'plugin-function',
            evaluationParameter: 'resolveDeviceOfflineError',
          }),
      ...auditDates,
    },
    {
      issueTypeId: issueTypes.DeviceNoResults.id,
      partnerId,
      resolutionConditions: pluginName
        ? JSON.stringify({
            evaluationMethod: 'sql-script',
            evaluationParameter: `./src/plugin/partner/${_.upperFirst(
              pluginName
            )}/sqlScripts/shouldResolveDeviceNoResults.sql`,
          })
        : JSON.stringify({
            evaluationMethod: 'plugin-function',
            evaluationParameter: 'resolveDeviceNoResultsError',
          }),
      ...auditDates,
    },
    {
      issueTypeId: issueTypes.ModuleFailureError.id,
      partnerId,
      resolutionConditions: JSON.stringify({
        evaluationMethod: 'plugin-function',
        evaluationParameter: 'resolveModuleFailureError',
      }),
      ...auditDates,
    },
    {
      issueTypeId: issueTypes.ModuleTemperatureError.id,
      partnerId,
      resolutionConditions: JSON.stringify({
        evaluationMethod: 'plugin-function',
        evaluationParameter: 'resolveModuleTemperatureError',
      }),
      ...auditDates,
    },
    {
      issueTypeId: issueTypes.MachineTemperatureError.id,
      partnerId,
      resolutionConditions: JSON.stringify({
        evaluationMethod: 'plugin-function',
        evaluationParameter: 'resolveMachineTemperatureError',
      }),
      ...auditDates,
    },
    {
      issueTypeId: issueTypes.ModulePowerError.id,
      partnerId,
      resolutionConditions: JSON.stringify({
        evaluationMethod: 'plugin-function',
        evaluationParameter: 'resolveModulePowerError',
      }),
      ...auditDates,
    },
    {
      issueTypeId: issueTypes.MachinePowerError.id,
      partnerId,
      resolutionConditions: JSON.stringify({
        evaluationMethod: 'plugin-function',
        evaluationParameter: 'resolveMachinePowerError',
      }),
      ...auditDates,
    },
    {
      issueTypeId: issueTypes.ModuleProceduralError.id,
      partnerId,
      resolutionConditions: JSON.stringify({
        evaluationMethod: 'plugin-function',
        evaluationParameter: 'resolveModuleProceduralError',
      }),
      ...auditDates,
    },
    {
      issueTypeId: issueTypes.MachineProceduralError.id,
      partnerId,
      resolutionConditions: JSON.stringify({
        evaluationMethod: 'plugin-function',
        evaluationParameter: 'resolveMachineProceduralError',
      }),
      ...auditDates,
    },
    {
      issueTypeId: issueTypes.ModuleUnknownError.id,
      partnerId,
      resolutionConditions: JSON.stringify({
        evaluationMethod: 'plugin-function',
        evaluationParameter: 'resolveModuleUnknownError',
      }),
      ...auditDates,
    },
    {
      issueTypeId: issueTypes.MachineUnknownError.id,
      partnerId,
      resolutionConditions: JSON.stringify({
        evaluationMethod: 'plugin-function',
        evaluationParameter: 'resolveMachineUnknownError',
      }),
      ...auditDates,
    },
    {
      issueTypeId: issueTypes.ReagentHealthError.id,
      partnerId,
      resolutionConditions: JSON.stringify({
        evaluationMethod: 'plugin-function',
        evaluationParameter: 'resolveReagentHealthError',
      }),
      ...auditDates,
    },
    {
      issueTypeId: issueTypes.InventoryStockout.id,
      partnerId,
      resolutionConditions: JSON.stringify({
        evaluationMethod: 'plugin-function',
        evaluationParameter: 'resolveIssueStockout',
      }),
      ...auditDates,
    },
    {
      issueTypeId: issueTypes.InventoryStockExpiring.id,
      partnerId,
      resolutionConditions: JSON.stringify({
        evaluationMethod: 'plugin-function',
        evaluationParameter: 'resolveIssueStockExpiring',
      }),
      ...auditDates,
    },
  ])
}

// ***********************************************************************
async function seedUnknownErrorsIssue(knex, { partnerId, auditFields }) {
  const auditDates = _.pick(auditFields, ['createdOn', 'updatedOn'])
  const [issueCategories, messageSeverities] = await Promise.all([
    rowsAsObject(knex, 'IssueCategory', 'externalId'),
    rowsAsObject(knex, 'MessageSeverity'),
  ])

  const { id: jobFunctionIdRegionalOfficer } = await knex('JobFunction')
    .where({
      name: 'Regional Officer',
      partnerId,
    })
    .first()

  const { id: jobFunctionIdLabUser } = await knex('JobFunction')
    .where({
      name: 'Lab User',
      partnerId,
    })
    .first()

  // ------------------------------------------
  // Module UnknownErrors issue templates
  // ------------------------------------------
  const { id: moduleAlertTemplateId } = await upsertSingle(
    knex,
    'AlertTemplate',
    [
      'message',
      'hideWhenSiteFilterIsSelected',
      'hideWhenSiteFilterIsNotSelected',
    ],
    {
      message:
        'Errors without code on module {{issue.data.moduleName}}, conduct troubleshooting.',
      ...auditFields,
    }
  )
  const { id: moduleSmsTemplateId } = await upsertSingle(
    knex,
    'SmsTemplate',
    ['message'],
    {
      message:
        '{{device.name}}: Errors without code on module {{issue.data.moduleName}}, conduct troubleshooting.',
      ...auditFields,
    }
  )
  const { id: moduleEmailTemplateId } = await upsertSingle(
    knex,
    'EmailTemplate',
    ['subject', 'body'],
    {
      subject:
        '{{device.name}}: Errors without code on module {{issue.data.moduleName}}',
      body: '{{device.name}}: Errors without code on module {{issue.data.moduleName}}, conduct troubleshooting.',
      htmlBody:
        '{{device.name}}: Errors without code on module <em>{{issue.data.moduleName}}</em>, conduct troubleshooting.',
      ...auditFields,
    }
  )

  // ------------------------------------------
  // Machine UnknownErrors issue templates
  // ------------------------------------------
  const { id: machineAlertTemplateId } = await upsertSingle(
    knex,
    'AlertTemplate',
    [
      'message',
      'hideWhenSiteFilterIsSelected',
      'hideWhenSiteFilterIsNotSelected',
    ],
    {
      message: 'Errors without code across machine, conduct troubleshooting',
      ...auditFields,
    }
  )
  const { id: machineSmsTemplateId } = await upsertSingle(
    knex,
    'SmsTemplate',
    ['message'],
    {
      message:
        '{{device.name}}: Errors without code across machine, conduct troubleshooting.',
      ...auditFields,
    }
  )
  const { id: machineEmailTemplateId } = await upsertSingle(
    knex,
    'EmailTemplate',
    ['subject', 'body'],
    {
      subject: '{{device.name}}: Errors without code across machine',
      body: '{{device.name}}: Errors without code across machine, conduct troubleshooting.',
      htmlBody:
        '{{device.name}}: Errors without code across machine, conduct troubleshooting.',
      ...auditFields,
    }
  )

  // ------------------------------------------
  // MessageType
  // ------------------------------------------
  const { id: moduleMessageTypeId } = await upsertSingle(knex, 'MessageType', {
    messageSeverityId: messageSeverities.Alert.id,
    alertTemplateId: moduleAlertTemplateId,
    smsTemplateId: moduleSmsTemplateId,
    emailTemplateId: moduleEmailTemplateId,
  })
  const { id: machineMessageTypeId } = await upsertSingle(knex, 'MessageType', {
    messageSeverityId: messageSeverities.Alert.id,
    alertTemplateId: machineAlertTemplateId,
    smsTemplateId: machineSmsTemplateId,
    emailTemplateId: machineEmailTemplateId,
  })

  // ------------------------------------------
  // IssueType
  // ------------------------------------------
  const { id: moduleIssueTypeId } = await upsertSingle(
    knex,
    'IssueType',
    uniqueKeys.IssueType,
    {
      name: 'Module Unknown Error',
      externalId: 'ModuleUnknownError',
      i18nKey: 'issueStatusModuleUnknownError',
      issueCategoryId: issueCategories.DeviceHealth.id,
      defaultMessageTypeId: moduleMessageTypeId,
    }
  )
  const { id: machineIssueTypeId } = await upsertSingle(
    knex,
    'IssueType',
    uniqueKeys.IssueType,
    {
      name: 'Machine Unknown Error',
      externalId: 'MachineUnknownError',
      i18nKey: 'issueStatusMachineUnknownError',
      issueCategoryId: issueCategories.DeviceHealth.id,
      defaultMessageTypeId: machineMessageTypeId,
    }
  )

  // ------------------------------------------
  // NotificationType
  // ------------------------------------------
  await upsertNotificationTypes(knex, [
    // Module
    {
      name: 'LU Module Unknown Error',
      partnerId,
      issueTypeId: moduleIssueTypeId,
      jobFunctionId: jobFunctionIdLabUser,
      level: 1,
      canAcknowledge: 1,
      messageTypeId: moduleMessageTypeId,
      ...auditFields,
    },
    {
      name: 'LU Escalated Module Unknown Error',
      partnerId,
      issueTypeId: moduleIssueTypeId,
      jobFunctionId: jobFunctionIdLabUser,
      level: 2,
      canAcknowledge: 0,
      messageTypeId: moduleMessageTypeId,
      ...auditFields,
    },
    {
      name: 'RO Escalated Module Unknown Error',
      partnerId,
      issueTypeId: moduleIssueTypeId,
      jobFunctionId: jobFunctionIdRegionalOfficer,
      level: 3,
      canAcknowledge: 0,
      messageTypeId: moduleMessageTypeId,
      ...auditFields,
    },
    // Module - RO View
    {
      name: 'LU Module Unknown Error - RO View',
      partnerId,
      issueTypeId: moduleIssueTypeId,
      jobFunctionId: jobFunctionIdRegionalOfficer,
      level: 1,
      canAcknowledge: 0,
      messageTypeId: moduleMessageTypeId,
      ...auditFields,
    },
    {
      name: 'LU Escalated Module Unknown Error - RO View',
      partnerId,
      issueTypeId: moduleIssueTypeId,
      jobFunctionId: jobFunctionIdRegionalOfficer,
      level: 2,
      canAcknowledge: 0,
      messageTypeId: moduleMessageTypeId,
      ...auditFields,
    },

    // Machine
    {
      name: 'LU Machine Unknown Error',
      partnerId,
      issueTypeId: machineIssueTypeId,
      jobFunctionId: jobFunctionIdLabUser,
      level: 1,
      canAcknowledge: 1,
      messageTypeId: machineMessageTypeId,
      ...auditFields,
    },
    {
      name: 'LU Escalated Machine Unknown Error',
      partnerId,
      issueTypeId: machineIssueTypeId,
      jobFunctionId: jobFunctionIdLabUser,
      level: 2,
      canAcknowledge: 0,
      messageTypeId: machineMessageTypeId,
      ...auditFields,
    },
    {
      name: 'RO Escalated Machine Unknown Error',
      partnerId,
      issueTypeId: machineIssueTypeId,
      jobFunctionId: jobFunctionIdRegionalOfficer,
      level: 3,
      canAcknowledge: 0,
      messageTypeId: machineMessageTypeId,
      ...auditFields,
    },
    // Machine - RO View
    {
      name: 'LU Machine Unknown Error - RO View',
      partnerId,
      issueTypeId: machineIssueTypeId,
      jobFunctionId: jobFunctionIdRegionalOfficer,
      level: 1,
      canAcknowledge: 0,
      messageTypeId: machineMessageTypeId,
      ...auditFields,
    },
    {
      name: 'LU Escalated Machine Unknown Error - RO View',
      partnerId,
      issueTypeId: machineIssueTypeId,
      jobFunctionId: jobFunctionIdRegionalOfficer,
      level: 2,
      canAcknowledge: 0,
      messageTypeId: machineMessageTypeId,
      ...auditFields,
    },
  ])

  // ------------------------------------------
  // Issue Escalation Triggers
  // ------------------------------------------
  await upsertIssueEscalationTrigger(knex, [
    // Module
    {
      issueTypeId: moduleIssueTypeId,
      partnerId,
      escalateToLevel: 2,
      escalationConditions: JSON.stringify({
        evaluationMethod: 'issue-age',
        evaluationParameter: { days: 30 },
      }),
      ...auditDates,
    },
    {
      issueTypeId: moduleIssueTypeId,
      partnerId,
      escalateToLevel: 3,
      escalationConditions: JSON.stringify({
        evaluationMethod: 'issue-age',
        evaluationParameter: { days: 60 },
      }),
      ...auditDates,
    },
    // Machine
    {
      issueTypeId: machineIssueTypeId,
      partnerId,
      escalateToLevel: 2,
      escalationConditions: JSON.stringify({
        evaluationMethod: 'issue-age',
        evaluationParameter: { days: 30 },
      }),
      ...auditDates,
    },
    {
      issueTypeId: machineIssueTypeId,
      partnerId,
      escalateToLevel: 3,
      escalationConditions: JSON.stringify({
        evaluationMethod: 'issue-age',
        evaluationParameter: { days: 60 },
      }),
      ...auditDates,
    },
  ])
}

// ***********************************************************************
async function updateUnknownErrorOnModuleMessage(knex) {
  await knex('AlertTemplate')
    .where({
      message:
        'Errors without code on module {{issue.data.moduleName}}, conduct troubleshooting.',
    })
    .update({
      message:
        'Possible failure on module {{issue.data.moduleName}} - unknown error - contact engineer',
    })

  await knex('SmsTemplate')
    .where({
      message:
        '{{device.name}}: Errors without code on module {{issue.data.moduleName}}, conduct troubleshooting.',
    })
    .update({
      message:
        '{{device.name}}: Possible failure on module {{issue.data.moduleName}} - unknown error - contact engineer',
    })

  await knex('EmailTemplate')
    .where({
      subject:
        '{{device.name}}: Errors without code on module {{issue.data.moduleName}}',
    })
    .update({
      body: '{{device.name}}: Possible failure on module {{issue.data.moduleName}} - unknown error - contact engineer',
      htmlBody:
        '{{device.name}}: Possible failure on module <em>{{issue.data.moduleName}}</em> - unknown error - contact engineer',
    })
}

// ***********************************************************************
async function seedIssues(
  knex,
  {
    partnerId,
    pluginName,
    auditFields,
    issueTypeBlacklist = [],
    issueTypeWhitelist = [],
  }
) {
  await seedStockIssues(knex)
  await seedStockIssuesUpdate(knex, 'Myanmar')
  await seedUnknownErrorsIssue(knex, { partnerId, auditFields })
  await seedIssueEventTriggersForPartner(knex, partnerId, {
    issueTypeWhitelist,
    issueTypeBlacklist,
  })

  // issue triggers
  await seedIssueEscalationTrigger(knex, { partnerId, pluginName, auditFields })
  await seedIssueResolutionTrigger(knex, { partnerId, pluginName, auditFields })
}

// ***********************************************************************
async function addUniqueKey(knex, tableName) {
  const uniqueKeysForTable = []
  await Promise.each(uniqueKeys[tableName], async column => {
    if (await knex.schema.hasColumn(tableName, column))
      uniqueKeysForTable.push(column)
  })
  await knex.schema.alterTable(tableName, table => {
    table.unique(uniqueKeysForTable, `${tableName}_unique`)
  })
}

async function dropUniqueKey(knex, tableName) {
  await Promise.all(
    _.map(foreignKeys[tableName], async ({ column }) => {
      if (await knex.schema.hasColumn(tableName, column)) {
        await knex.schema.table(tableName, table => {
          table.dropForeign(column)
        })
      }
    })
  )

  await knex.schema.alterTable(tableName, table => {
    table.dropUnique(uniqueKeys[tableName], `${tableName}_unique`)
  })

  await Promise.all(
    _.map(foreignKeys[tableName], async ({ column, reference }) => {
      if (await knex.schema.hasColumn(tableName, column)) {
        await knex.schema.table(tableName, table => {
          table.foreign(column).references(reference)
        })
      }
    })
  )
}

async function updateCategoryAssay(knex) {
  const categories = await knex('ResultCategory').select(
    'id',
    'name',
    'externalId'
  )

  await Promise.each(categories, async ({ id, externalId }) => {
    let json
    if (
      [
        'Detected',
        'Trace Detected',
        'MoreThan40',
        'MoreThan150',
        'MoreThan550',
        'MoreThan1000',
        'Resistant',
        'Positive1',
        'Positive2',
        'Positive3',
        'Scanty',
        'PositiveMTB',
        'Positive',
      ].indexOf(externalId) >= 0
    ) {
      json = {
        requiresTreatment: true,
        emphasize: true,
      }
    } else if (
      [
        'Indeterminate',
        'Invalid',
        'NoResult',
        'Error',
        'CollectNewSample',
        'Discordant',
        'Rejected',
        'Missing',
        'Susceptible',
        'Contaminated',
        'PositiveMOTT',
      ].indexOf(externalId) >= 0
    ) {
      json = {
        requiresTreatment: false,
        emphasize: true,
      }
    } else if (
      [
        'Success',
        'LessThan40',
        'LessThan150',
        'LessThan550',
        'LessThan1000',
        'Unknown',
        'NotDetected',
        'Negative',
        'Inconclusive',
      ].indexOf(externalId) >= 0
    ) {
      json = {
        requiresTreatment: false,
        emphasize: false,
      }
    }
    if (!_.isEmpty(json)) {
      await knex('ResultCategoryAssay')
        .where('resultCategoryId', id)
        .update(json)
    }
  })
}

async function updateAssayResultCategoryTreatmentEmphasize(knex) {
  const categories = await knex('ResultCategory').select(
    'id',
    'name',
    'externalId'
  )

  await Promise.each(categories, async ({ id, externalId }) => {
    let json
    if (
      [
        'Detected',
        'Trace Detected',
        'MoreThan40',
        'MoreThan150',
        'MoreThan550',
        'MoreThan1000',
        'Positive',
      ].indexOf(externalId) >= 0
    ) {
      json = {
        requiresTreatment: true,
        emphasize: true,
      }
    } else if (
      [
        'Indeterminate',
        'Invalid',
        'NoResult',
        'Error',
        'CollectNewSample',
        'Discordant',
        'Rejected',
        'Missing',
        'Inconclusive',
      ].indexOf(externalId) >= 0
    ) {
      json = {
        requiresTreatment: false,
        emphasize: true,
      }
    } else {
      json = {
        requiresTreatment: false,
        emphasize: false,
      }
    }
    if (!_.isEmpty(json)) {
      await knex('ResultCategoryAssay')
        .where('resultCategoryId', id)
        .update(json)
    }
  })
}

async function addLicenses(knex) {
  const { data: licensesByPartner } = await readJson(
    `./seeds/fixtures/License.json`
  )

  const [partners] = await Promise.all([rowsAsObject(knex, 'Partner')])

  await Promise.each(
    licensesByPartner,
    async ({ partnerNames, createdOn, content }) => {
      await knex('License').insert(
        _.map(partnerNames, partnerName => ({
          partnerId: partnerName ? partners[partnerName].id : null,
          createdOn: new Date(createdOn),
          content: content.replace('PARTNERNAME', partnerName),
        }))
      )
    }
  )
}

async function addLicensePersons(knex, personNameToExclude = '') {
  const persons = await knex('Person')
    .whereNot('name', personNameToExclude)
    .select('id', 'lastPartnerId', 'name')

  await Promise.all(
    _.map(persons, async p => {
      const { id: licenseId } = await knex('License')
        .where('partnerId', p.lastPartnerId)
        .orWhere('partnerId', null)
        .orderBy('partnerId', 'desc')
        .orderBy('createdOn', 'desc')
        .first('id')
      await knex('LicensePerson').insert({
        personId: p.id,
        licenseId,
        ip: '127.0.0.1',
        acceptedOn: new Date(),
      })
    })
  )
}

async function addDeviceCapacities(knex, data) {
  const { data: deviceCapacitiesByPartner } =
    data || (await readJson(`./seeds/fixtures/DeviceCapacity.json`))

  const [partners] = await Promise.all([rowsAsObject(knex, 'Partner')])
  const [deviceTypes] = await Promise.all([
    rowsAsObject(knex, 'DeviceType', 'externalId'),
  ])

  await Promise.each(
    deviceCapacitiesByPartner,
    async ({
      deviceTypeExternalId,
      defaultForDeviceType,
      name,
      dailyCapacity,
    }) => {
      if (deviceTypes[deviceTypeExternalId]) {
        await upsertItems(
          knex,
          'DeviceCapacity', // tableName
          ['partnerId', 'deviceTypeId', 'name'], // whereKeys
          _.map(partners, partner => ({
            partnerId: partner.id,
            deviceTypeId: deviceTypes[deviceTypeExternalId].id,
            defaultForDeviceType,
            name,
            dailyCapacity,
          }))
        )
      } else {
        await Promise.resolve()
      }
    }
  )
}

async function setCapacityForExistingDevices(knex) {
  const devices = await knex('Device')
    .where('deviceCapacityId', null)
    .distinct('partnerId', 'deviceTypeId')

  const deviceCapacities = await knex('DeviceCapacity').select(
    'id',
    'partnerId',
    'deviceTypeId',
    'defaultForDeviceType',
    'name'
  )

  await Promise.each(devices, ({ partnerId, deviceTypeId }) => {
    const deviceCapacityByPartnerId = _.find(
      deviceCapacities,
      dc =>
        dc.partnerId === partnerId &&
        dc.deviceTypeId === deviceTypeId &&
        dc.defaultForDeviceType === 1
    )
    if (deviceCapacityByPartnerId && deviceCapacityByPartnerId.id) {
      return knex('Device')
        .where({ partnerId })
        .where({ deviceTypeId })
        .update({ deviceCapacityId: deviceCapacityByPartnerId.id })
    }
  })

  // For GeneXperts, we can go one step further and set the device capacity
  // based unique modules in historic results
  const genexpertDevicesWithModules = await knex('Result as r')
    .join('Device as d', 'd.id', 'r.deviceId')
    .join('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
    .where('r.endedOn', '>', subDays(now, 90))
    .where('dt.externalId', 'CepheidGeneXpert')
    .select('d.partnerId', 'r.deviceId', 'd.deviceTypeId')
    .countDistinct('r.moduleName as modules')
    .groupBy('d.partnerId', 'r.deviceId', 'd.deviceTypeId')
    .having('modules', '>', 4)

  await Promise.each(
    genexpertDevicesWithModules,
    ({ partnerId, deviceTypeId, deviceId, modules }) => {
      const deviceCapacityByPartnerId = _.find(
        deviceCapacities,
        dc =>
          dc.partnerId === partnerId &&
          dc.deviceTypeId === deviceTypeId &&
          ((dc.name === '8 modules' && modules > 4 && modules <= 8) ||
            (dc.name === '16 modules' && modules > 8 && modules <= 16) ||
            (dc.name === '32 modules' && modules > 16 && modules <= 32))
      )
      if (deviceCapacityByPartnerId && deviceCapacityByPartnerId.id) {
        return knex('Device')
          .where({ id: deviceId })
          .update({ deviceCapacityId: deviceCapacityByPartnerId.id })
      }
    }
  )
}

async function getSeedsRan(knex) {
  return knex('AspectSeed as ap')
    .where({ success: true })
    .select('ap.fileName')
    .then(items =>
      items.reduce((memo, row) => {
        if (!memo[row.fileName]) {
          memo[row.fileName] = true
        }
        return memo
      }, {})
    )
}

async function seedDeviceMaintenanceType(knex) {
  const { data: deviceMaintenanceTypes } = await readJson(
    `./seeds/fixtures/DeviceMaintenanceType.json`
  )

  await upsertItems(
    knex,
    'DeviceMaintenanceType', // tableName
    'externalId', // whereKeys
    deviceMaintenanceTypes
  )
}

async function insertSites(knex, partnerId, countryId, sites) {
  const now = new Date()
  const { id: adminId } = await knex('User').where('name', 'admin').first('id')

  // insert sites from a JSON file. Safe to run multiple times. Will only add sites that don't exist yet (based on externalId)
  await Promise.each(sites, async site => {
    let siteId = null
    const existingSite = await knex('Site')
      .where('externalId', site.externalId)
      .first('id')

    const geography = await knex('Geography as g')
      .join('State as s', 'g.stateId', 's.id')
      .join('Lga as l', 'g.lgaId', 'l.id')
      .where({ countryId })
      .where('s.name', site.stateName)
      .where('l.name', site.lgaName)
      .first('g.id')

    if (!geography)
      throw new Error(
        `Missing geography for state ${site.stateName} and lga ${site.lgaName}`
      )

    const { id: siteGeographyId } = geography
    if (existingSite) {
      siteId = existingSite.id
      await knex('Site').where('id', siteId).update({
        geographyId: siteGeographyId,
        name: site.name,
        externalId: site.externalId,
        updatedOn: now,
        updatedBy: adminId,
      })
    } else {
      ;[siteId] = await knex('Site').insert({
        partnerId,
        geographyId: siteGeographyId,
        name: site.name,
        shortName: site.shortName,
        externalId: site.externalId,
        notes: site.notes,
        city: site.city,
        street1: site.street1,
        street2: site.street2,
        zip: site.zip,
        latitude: site.latitude || null,
        longitude: site.longitude || null,
        timezoneId: site.timezoneId,
        hoursStart: site.hoursStart,
        hoursEnd: site.hoursEnd,
        createdOn: now,
        createdBy: adminId,
        updatedOn: now,
        updatedBy: adminId,
      })
    }

    await Promise.each(site.tags, async tag => {
      const tagDetails = { partnerId, title: tag }
      let tagId = null
      const existingTag = await knex('Tag').where(tagDetails).first('id')
      if (existingTag) {
        tagId = existingTag.id
      } else {
        ;[tagId] = await knex('Tag').insert(tagDetails)
      }

      const siteTagDetails = { tagId, siteId }
      const { siteTagCount } = await knex('SiteTag')
        .where(siteTagDetails)
        .count('tagId as siteTagCount')
        .first()

      if (siteTagCount === 0) {
        await knex('SiteTag').insert(siteTagDetails)
      }
    })
  })
}

async function getPermissonByModuleAndActivity(knex, module, activity) {
  return knex('Permission').where({ module, activity }).first()
}

async function getPartnerByName(knex, name) {
  const partner = await knex('Partner').where({ name }).first()
  return partner
}

async function getGeographyId(knex, countryId, stateId, lgaId) {
  const { geographyId } = await knex('Geography as g')
    .modify(
      (queryBuilder, { countryId, stateId, lgaId }) => {
        if (countryId) {
          queryBuilder = queryBuilder.where('g.countryId', countryId)

          if (stateId) {
            queryBuilder = queryBuilder.where('g.stateId', stateId)

            if (lgaId) queryBuilder = queryBuilder.where('g.lgaId', lgaId)
            else queryBuilder = queryBuilder.where('g.lgaId', null)
          } else {
            queryBuilder = queryBuilder.where('g.stateId', null)
          }
        }
      },
      { countryId, stateId, lgaId }
    )
    .first('id as geographyId')
  return geographyId
}

async function initDataFromFixture(knex, tableName, keyColumn = 'externalId') {
  const fixtureData = await readJson(`./seeds/fixtures/${tableName}.json`)
  const itemsNew = fixtureData.data || fixtureData
  const itemsOld = await knex(tableName)
    .whereIn(
      keyColumn,
      _.map(itemsNew, item => item[keyColumn])
    )
    .select(keyColumn)
  const oldIds = itemsOld.map(x => x[keyColumn])
  const itemsToUpdate = itemsNew.filter(x => oldIds.includes(x[keyColumn]))
  const itemsToInsert = itemsNew.filter(x => !oldIds.includes(x[keyColumn]))
  if (itemsToUpdate.length > 0) {
    await Promise.each(itemsToUpdate, async item => {
      const updatedRecord = _.omit(item, keyColumn)
      if (!_.isEmpty(updatedRecord)) {
        await knex(tableName)
          .update(updatedRecord)
          .where(keyColumn, item[keyColumn])
      }
    })
  }
  // insert only items which not exist in the table
  return knex(tableName).insert(itemsToInsert)
}

async function updateReportableInResultCategoryAssay(knex) {
  // result categories with { reportable: 0 }
  const resultCategory = await allResultCategoryToId()
  const resultCategoryIds = [
    resultCategory.Invalid,
    resultCategory.NoResult,
    resultCategory.Error,
    resultCategory.Rejected,
    resultCategory.Unknown,
  ].filter(x => !!x)

  if (resultCategoryIds.length > 0) {
    await knex('ResultCategoryAssay')
      .update({ reportable: 0 })
      .whereIn('resultCategoryId', resultCategoryIds)
  }
}

const resultTimeFrameInDays = 60
const now = new Date()

function calculateDateForResult(
  currentResult,
  totalResults,
  randomMillisToAdd
) {
  // unlike TB and HIV, we want to generate an exponential curve here
  const daysToSubtract = Math.ceil(Math.random() ** 4 * resultTimeFrameInDays)

  return addMilliseconds(
    subDays(now, daysToSubtract),
    _.random(randomMillisToAdd)
  )
}

function randomOption(availableOptions, required = false) {
  if (_.isEmpty(availableOptions)) {
    return
  }
  if (_.isArray(availableOptions)) {
    if (availableOptions.length === 1 && required) {
      return availableOptions[0]
    }
    availableOptions = availableOptions.reduce(
      (optionsWithProbability, option) => {
        optionsWithProbability[option] =
          100 /
          (required ? availableOptions.length : availableOptions.length + 1)
        return optionsWithProbability
      }
    )
  }
  let maxPercent = _.sum(Object.values(availableOptions))
  if (maxPercent < 100 && !required) {
    maxPercent = 100
  }
  let lastOptionMaxPercentile = 0
  const options = Object.keys(availableOptions)
  options.forEach(option => {
    const optionProbability = availableOptions[option]
    availableOptions[option] = [lastOptionMaxPercentile, optionProbability]
    lastOptionMaxPercentile = optionProbability
  })
  const randomPercentile = _.random(0.0001, maxPercent)
  for (let i = 0; i < options.length; i++) {
    const option = options[i]
    const optionPercentileRange = availableOptions[option]
    if (
      randomPercentile > optionPercentileRange[0] &&
      randomPercentile <= optionPercentileRange[1]
    ) {
      return option
    }
  }
  if (required) {
    return options[options.length - 1]
  }
}

async function seedPartnerAssay(knex) {
  const { 'COVID-19 Test': assayTypeCovid19Id } = await allAssayTypeToId()

  const partnerIds = await knex('Partner').pluck('id')
  const assays = await knex('Assay').select('id', 'assayTypeId')

  // for all Partners ...
  await Promise.each(partnerIds, async partnerId =>
    Promise.each(assays, async ({ id: assayId, assayTypeId }) => {
      const isCovid19 = assayTypeId === assayTypeCovid19Id
      // ... upsert entry to PartnerAssay
      const partnerAssay = await knex('PartnerAssay')
        .where({ partnerId, assayId })
        .first()
      if (!partnerAssay) {
        await knex('PartnerAssay').insert({
          partnerId,
          assayId,

          canCreate: isCovid19,
          canDelete: isCovid19,
          canEdit: isCovid19,
        })
      }
    })
  )
}

async function seedPartnerDisease(knex) {
  const partnerIds = await knex('Partner').pluck('id')
  const diseaseIds = await knex('Disease').pluck('id')

  // for all Partners ...
  await Promise.each(partnerIds, async partnerId =>
    Promise.each(diseaseIds, async diseaseId => {
      // ... upsert entry to PartnerDisease table
      const partnerDisease = await knex('PartnerDisease')
        .where({ partnerId, diseaseId })
        .first()
      if (!partnerDisease) {
        await knex('PartnerDisease').insert({
          partnerId,
          diseaseId,
        })
      }
    })
  )
}

function getUniqueId() {
  return _.times(6, () => _.toUpper(_.random(36).toString(36))).join('')
}

/**
 * Gets a random date for a result linked to the previous one provided.
 * @param  {[object]} previousResult The previous result
 * @return {[date]} A random date next to the previous result's endedOn field
 */
function getLinkedResultDate(previousResult) {
  const previousResultDateMillis = Math.max(
    previousResult.startedOn,
    previousResult.endedOn
  )

  const nowUTCMillis = new Date()

  if (previousResultDateMillis > nowUTCMillis)
    throw new Error("Previous result's date can't be greater than today")

  const diffMillis = nowUTCMillis - previousResultDateMillis

  const rndMillis = _.random(1, diffMillis)
  const newStartDate = new Date(previousResultDateMillis + rndMillis)

  return newStartDate
}

/**
 * Gets the randomly generated results fields startedOn, endedOn, createdOn and updatedOn based on the date provided as parameter.
 * @param  {[object]} startedOn The based on date
 * @return {[object]} An object containing fields startedOn, endedOn, createdOn and updatedOn.
 */
function getDateFields(startedOn) {
  const necessaryDiffMillis = 120 * 1000

  const now = new Date()
  const nowMillis = format(addMinutes(now, now.getTimezoneOffset()), 'T')
  const startedOnMillis = format(
    addMinutes(startedOn, startedOn.getTimezoneOffset()),
    'T'
  )
  const diffMillis = nowMillis - startedOnMillis

  let endedOn
  let createdOn
  let updatedOn = null

  if (diffMillis < necessaryDiffMillis) {
    // Started On date is close to now, so we calculate the gap's millis
    const gapMillies = diffMillis / 3
    const addMillisGap = date => addMilliseconds(date, gapMillies)
    endedOn = addMillisGap(startedOn)
    createdOn = addMillisGap(endedOn)
    updatedOn = addMillisGap(createdOn)
  } else {
    // Started On date isn't close to now, so we can use fixed gaps
    endedOn = addMinutes(startedOn, 100)
    createdOn = addMinutes(endedOn, 120)
    updatedOn = addMinutes(createdOn, 180)
  }

  return {
    startedOn,
    endedOn,
    createdOn,
    updatedOn,
  }
}

async function getResultForms(knex) {
  return knex('ResultForm')
    .select()
    .then(items =>
      items.map(resultForm => ({
        ...resultForm,
        formSchema: JSON.parse(resultForm.formSchema),
      }))
    )
}

async function seedJobFunctionsAndUsersForOperationalData(
  knex,
  {
    auditFields,
    countryId,
    culture,
    geographyId,
    partnerId,
    passwords = {},
    timezone,
  }
) {
  const now = new Date()
  const userIds = {}
  const personIds = {}
  if (!geographyId) {
    const geography = await knex('Geography')
      .where('countryId', countryId)
      .whereNull('stateId')
      .whereNull('lgaId')
      .first('id')
    geographyId = geography.id
  }
  // -------------------------------------------
  // Users, Persons
  await Promise.all(
    _.map(
      [
        'cepheid', // for jobFunction 'Device Maker'
        'ntp', // for jobFunction 'NTP'
        'technician', // for jobFunction 'Technician'
        'usaid', // for jobFunction 'Donor'
      ],
      async name => {
        const { id: userId } = await upsertSingle(
          knex,
          'User', // tableName
          'name', // whereKeys
          Object.assign(
            passwords[name]
              ? { password: bcrypt.hashSync(passwords[name], saltRounds) }
              : {},
            {
              name: name.toLowerCase(),
              legacyPassword: 0,
              approved: 1,
              createdOn: now,
              lockedOut: 0,
              failedPasswordAttempts: 0,
            }
          )
        )

        userIds[name.toLowerCase()] = userId

        const lastPartnerId = partnerId
        const lastCountryId = countryId

        const { id: personId } = await upsertSingle(
          knex,
          'Person', // tableName
          'userId', // whereKeys
          {
            userId,
            name,
            lastPartnerId,
            lastCountryId,
            timezone,
            culture,
            geographyId,
            ...auditFields,
          }
        )
        personIds[name.toLowerCase()] = personId
      }
    )
  )

  const jobFunctionsById = await allJobFunctionToId()
  // -------------------------------------------
  // Jobs
  const initJob = async (personId, jobFunctionId) => {
    const { id } = await upsertSingle(
      knex,
      'Job',
      ['personId', 'jobFunctionId'],
      { personId, jobFunctionId }
    )
    return id
  }
  const jobIdCepheid = await initJob(
    personIds.cepheid,
    jobFunctionsById.deviceMaker
  )
  const jobIdNtp = await initJob(personIds.ntp, jobFunctionsById.ntp)
  const jobIdTechnician = await initJob(
    personIds.technician,
    jobFunctionsById.technician
  )
  const jobIdUsaid = await initJob(personIds.usaid, jobFunctionsById.donor)

  // -------------------------------------------
  // Constrain jobs by context
  await upsertItems(
    knex,
    'JobContext',
    ['jobId', 'geographyId'],
    [
      { jobId: jobIdCepheid, geographyId },
      { jobId: jobIdNtp, geographyId },
      { jobId: jobIdTechnician, geographyId },
      { jobId: jobIdUsaid, geographyId },
    ]
  )

  return {
    userIds,
    personIds,
    jobFunctionIdDeviceMaker: jobFunctionsById.deviceMaker,
    jobFunctionIdNtp: jobFunctionsById.ntp,
    jobFunctionIdTechnician: jobFunctionsById.technician,
    jobFunctionIdDonor: jobFunctionsById.donor,
    jobIdCepheid,
    jobIdNtp,
    jobIdTechnician,
    jobIdUsaid,
  }
}

/**
 * Adds a new JobFunctionPermission row for each permission id at the permissionsTo parameter that will be associated to the job functions that have assigned one of the permissions of the permissionsFrom one
 * @param {object} knex Knex instance
 * @param {array} currentPermissions An array of permissions ids
 * @param {array} additionalPermissions An array of permissions ids that will be associated to the
 */
async function mapJobFunctionPermissions(
  knex,
  currentPermissions,
  additionalPermissions
) {
  const jobFunctionsIds = await knex('JobFunctionPermission')
    .whereIn('permissionId', currentPermissions)
    .distinct('jobFunctionId')
  let insertJobs = []
  for (let index = 0; index < jobFunctionsIds.length; index++) {
    const { jobFunctionId } = jobFunctionsIds[index]
    insertJobs = [
      ...insertJobs,
      ...additionalPermissions.map(permissionId =>
        knex('JobFunctionPermission')
          .where({ jobFunctionId, permissionId })
          .then(rows => {
            if (rows.length === 0) {
              return knex('JobFunctionPermission').insert({
                permissionId,
                jobFunctionId,
              })
            }
          })
      ),
    ]
  }

  if (insertJobs.length > 0) await Promise.all(insertJobs)
}

/**
 * Removes the jobs and permissions for the specified ids
 * @param {object} knex Knex instance
 * @param {array} permissionsToRemove An array of permissions ids
 */
async function removePermissions(knex, permissions) {
  await knex('JobFunctionPermission')
    .whereIn('permissionId', permissions)
    .delete()
  await knex('Permission').whereIn('id', permissions).delete()
}

async function seedDashboardsJsonInDashboardWidget(knex, widgets) {
  // fill in default value for all records - this is needed because `.defaultsTo()` can not be applied for JSON field
  // but not critical if field dashboards remains null - we handle setting default value of { home: {} } in both API and WEB
  await knex('DashboardWidget')
    .whereNull('dashboards')
    .update({
      dashboards: JSON.stringify({ home: {} }),
    })

  await Promise.all(
    _.map(
      widgets.filter(({ dashboards }) => _.isPlainObject(dashboards)),
      ({ dashboards, externalId }) =>
        knex('DashboardWidget')
          .where({ externalId })
          .update({
            dashboards: JSON.stringify(dashboards),
          })
    )
  )
}

/**
 * Updates all the defined props searching by module and activity
 * @param {object} knex Knex instance
 * @param {array} permissions An array of permissions definitions. The next props are mandatory: module, activity. Currently, you can also specify description.
 */
async function updatePermissions(knex, permissions) {
  return Promise.each(permissions, async ({ module, activity, ...restProps }) =>
    knex('Permission')
      .where({ module, activity })
      .update({ ...restProps })
  )
}

/**
 * Removes a permission activity and replaces it for another one
 * @param  {[object]} knex The knex instance
 * @param  {[string]} ativityToRemove The activity that want to remove. Ex.: 'admin'
 * @param  {[string]} activityToReplaceFor The activity that want to replace the one that'll be removed. Ex.: 'edit'
 * @deprecated this method breaks seeding if you later re-add the removed permissions.
 * Instead use @example await upsertPermissions(knex, permissions)
 */
async function removeAndReplaceActivity(
  knex,
  activityToRemove,
  activityToReplaceFor
) {
  const modules = await getPermissionModules(knex)
  const modulesNames = Object.keys(modules)

  await Promise.each(modulesNames, async moduleName => {
    const activityToRemoveId = modules[moduleName][activityToRemove]

    if (activityToRemoveId) {
      let activityToReplaceForId = modules[moduleName][activityToReplaceFor]

      // If module has activityToRemove, reassignation should be done
      if (!activityToReplaceForId) {
        // If module doesn't have the activityToReplaceFor
        // Inserts the new permission
        const [permissionId] = await knex('Permission').insert({
          module: moduleName,
          activity: activityToReplaceFor,
        })

        activityToReplaceForId = permissionId
      }

      // Assigns the activityToReplaceFor to all the job functions that use the activityToRemove
      await mapJobFunctionPermissions(
        knex,
        [activityToRemoveId],
        [activityToReplaceForId]
      )

      await knex('JobFunctionPermission')
        .where({ permissionId: activityToRemoveId })
        .delete()
      await knex('Permission').where({ id: activityToRemoveId }).delete()
    }
  })
}

// ***********************************************************************
async function seedIssueType(
  knex,
  issueType,
  { userName },
  issueEventTrigger = {}
) {
  const { id: adminId } = await knex('User')
    .where({ name: userName })
    .first('id')

  const now = new Date()
  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }

  const issue = (await getBaseIssues(auditFields))[issueType]
  if (!issue) return

  // ------------------------------------------
  // issue templates
  // ------------------------------------------
  const { id: alertTemplateId = null } = issue.AlertTemplate
    ? await upsertSingle(knex, 'AlertTemplate', ['message'], {
        ...issue.AlertTemplate,
        ...auditFields,
      })
    : {}

  const { id: smsTemplateId = null } = issue.SmsTemplate
    ? await upsertSingle(knex, 'SmsTemplate', ['message'], {
        ...issue.SmsTemplate,
        ...auditFields,
      })
    : {}

  const { id: emailTemplateId = null } = issue.EmailTemplate
    ? await upsertSingle(knex, 'EmailTemplate', ['subject', 'body'], {
        ...issue.EmailTemplate,
        ...auditFields,
      })
    : {}

  const { id: pushNotificationTemplateId = null } =
    issue.PushNotificationTemplate
      ? await upsertSingle(
          knex,
          'PushNotificationTemplate',
          ['title', 'body'],
          {
            ...issue.PushNotificationTemplate,
            ...auditFields,
          }
        )
      : {}

  // ------------------------------------------
  // MessageType
  // ------------------------------------------
  const { id: moduleMessageTypeId } = await upsertSingle(knex, 'MessageType', {
    ...issue.MessageType,
    alertTemplateId,
    smsTemplateId,
    emailTemplateId,
    pushNotificationTemplateId,
  })

  // ------------------------------------------
  // IssueType
  // ------------------------------------------
  const { id: issueTypeId } = await upsertSingle(
    knex,
    'IssueType',
    uniqueKeys.IssueType,
    {
      ...issue.issueType,
      defaultMessageTypeId: moduleMessageTypeId,
    }
  )
  if (!_.isEmpty(issueEventTrigger))
    await upsertSingle(
      knex,
      'IssueEventTrigger',
      uniqueKeys.IssueEventTrigger,
      issueEventTrigger
    )
  return issueTypeId
}

async function deleteIssueTypes(knex, issueTypesToDelete) {
  await Promise.each(issueTypesToDelete, async issueTypeExternalId => {
    const issueTypeId = await issueTypeToId(issueTypeExternalId)
    if (issueTypeId) {
      await knex('Issue').where({ issueTypeId }).del()
      await knex('NotificationType').where({ issueTypeId }).del()
      await knex('IssueEventTrigger').where({ issueTypeId }).del()
      await knex('IssueType').where({ id: issueTypeId }).del()
    }
  })

  // delete unused message types and templates
  await knex('MessageType')
    .whereNotIn(
      'id',
      _.map(
        await knex('NotificationType').select('messageTypeId'),
        nt => nt.messageTypeId || -1
      )
    )
    .whereNotIn(
      'id',
      _.map(
        await knex('IssueType').select('defaultMessageTypeId'),
        nt => nt.defaultMessageTypeId || -1
      )
    )
    .del()
}

async function updateIssueNotificationTemplates(
  knex,
  issueTypesToUpdate,
  { userName }
) {
  const { id: adminId } = await knex('User')
    .where({ name: userName })
    .first('id')

  const now = new Date()
  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }

  await Promise.each(issueTypesToUpdate, async issueTypeExternalId => {
    const issueTypeId = await issueTypeToId(issueTypeExternalId)
    const issue = (await getBaseIssues())[issueTypeExternalId]

    if (issueTypeId && issue) {
      // old message type (to update later)
      const notificationTypes = await knex('NotificationType')
        .where({ issueTypeId })
        .select()

      await Promise.each(notificationTypes, async notificationType => {
        // if no template, we'll set it to null in the MessageType table
        // Alert
        let alertTemplateId = null
        if (issue.AlertTemplate) {
          alertTemplateId = (
            await upsertSingle(knex, 'AlertTemplate', ['message'], {
              ...issue.AlertTemplate,
              ...auditFields,
            })
          ).id
        }
        await knex('MessageType')
          .where('id', notificationType.messageTypeId)
          .update('alertTemplateId', alertTemplateId)

        // Email
        let emailTemplateId = null
        if (issue.EmailTemplate) {
          emailTemplateId = (
            await upsertSingle(knex, 'EmailTemplate', ['subject', 'body'], {
              ...issue.EmailTemplate,
              ...auditFields,
            })
          ).id
        }
        await knex('MessageType')
          .where('id', notificationType.messageTypeId)
          .update('emailTemplateId', emailTemplateId)

        // Sms
        let smsTemplateId = null
        if (issue.SmsTemplate) {
          smsTemplateId = (
            await upsertSingle(knex, 'SmsTemplate', ['message'], {
              ...issue.SmsTemplate,
              ...auditFields,
            })
          ).id
        }
        await knex('MessageType')
          .where('id', notificationType.messageTypeId)
          .update('smsTemplateId', smsTemplateId)
      })
    }
  })

  // now that we're done updating/deleting, drop any unused templates
  const mTypes = await knex('MessageType').select()

  const alertTemplatesToDelete = _.uniq(
    _.map(mTypes, mt => mt.alertTemplateId || -1)
  )
  await knex('AlertMessage')
    .whereNotIn('alertTemplateId', alertTemplatesToDelete)
    .del()
  await knex('AlertTemplate').whereNotIn('id', alertTemplatesToDelete).del()

  const emailTemplatesToDelete = _.uniq(
    _.map(mTypes, mt => mt.emailTemplateId || -1)
  )
  await knex('EmailMessage')
    .whereNotIn('emailTemplateId', emailTemplatesToDelete)
    .del()

  await knex('EmailTemplate').whereNotIn('id', emailTemplatesToDelete).del()

  const smsTemplatesToDelete = _.uniq(
    _.map(mTypes, mt => mt.smsTemplateId || -1)
  )
  await knex('SmsMessage')
    .whereNotIn('smsTemplateId', smsTemplatesToDelete)
    .del()
  await knex('SmsTemplate').whereNotIn('id', smsTemplatesToDelete).del()
}

async function upsertForms(knex, partnerId, forms) {
  if (!partnerId) {
    try {
      // eslint-disable-next-line prefer-const
      ;({ partnerId } = await knex('User as u')
        .join('Person as p', 'u.id', 'p.userId')
        .join('Job as j', 'p.id', 'j.personId')
        .join('JobFunction as jf', 'j.jobFunctionId', 'jf.id')
        .where('jf.name', 'admin')
        .first('p.lastPartnerId as partnerId'))
      if (!partnerId) {
        ;({ partnerId } = await knex('Partner as p').first('id as partnerId'))
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('Error inserting forms', e)
      return false
    }
  }
  await Promise.each(_.keys(forms), async key => {
    const {
      fileName,
      formDefinition: {
        order,
        title,
        i18nKeyTitle,
        externalId,
        formTypeExternalId,
        diseaseExternalId,
        assayExternalId,
        subTitle,
        i18nKeySubTitle,
        description,
        i18nKeyDescription,
      },
    } = forms[key]

    const formTypeId = await formTypeToId(formTypeExternalId)
    const diseaseId = await diseaseToId(diseaseExternalId)
    const assayId = await assayToId(assayExternalId)

    const { id: formDefinitionSchemaId } = await upsertSingle(
      knex,
      'FormDefinitionSchema',
      {
        jsonSchemaFile: fileName,
      }
    )

    await upsertSingle(
      knex,
      'FormDefinition',
      {
        partnerId,
        externalId,
      },
      {
        formTypeId,
        partnerId,
        diseaseId,
        order,
        assayId,
        title,
        i18nKeyTitle,
        subTitle,
        i18nKeySubTitle,
        description,
        i18nKeyDescription,
        externalId,
        formDefinitionSchemaId,
      }
    )
  })
  return true
}

module.exports = {
  seed,
  seedTable,
  getSeedsRan,
  rowsAsObject,
  getDefaultMessageTypes,
  seedStockIssues,
  seedStockIssuesUpdate,
  getPermissionModules,
  seedIssueEventTriggersForPartner,
  upsertItems,
  upsertSingle,
  seedIssues,
  getGeographyId,
  getPartnerByName,
  getPermissonByModuleAndActivity,

  seedNotificationTypes,
  upsertNotificationTypes,

  seedIssueEscalationTrigger,
  upsertIssueEscalationTrigger,

  seedIssueResolutionTrigger,
  upsertIssueResolutionTrigger,

  seedUnknownErrorsIssue,
  updateUnknownErrorOnModuleMessage,

  uniqueKeys,
  addUniqueKey,
  dropUniqueKey,

  addLicenses,
  addLicensePersons,

  addDeviceCapacities,
  setCapacityForExistingDevices,
  seedDeviceMaintenanceType,

  updateCategoryAssay,
  updateAssayResultCategoryTreatmentEmphasize,
  insertSites,

  addFollowUps,
  removeFollowUps,

  initDataFromFixture,
  updateReportableInResultCategoryAssay,

  calculateDateForResult,
  randomOption,

  seedPartnerAssay,
  seedPartnerDisease,

  getUniqueId,
  getLinkedResultDate,
  getDateFields,

  getResultForms,

  seedJobFunctionsAndUsersForOperationalData,
  mapJobFunctionPermissions,
  seedDashboardsJsonInDashboardWidget,
  removeAndReplaceActivity,
  removePermissions,
  updatePermissions,

  seedIssueType,
  seedIssueEscalationTriggersForPartner,
  deleteIssueTypes,
  updateIssueNotificationTemplates,

  upsertForms,
}
