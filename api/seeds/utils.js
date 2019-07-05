const Promise = require('bluebird')
const _ = require('lodash')
const { readJson } = require('fs-extra')
const path = require('path')
const { allFeatureToId } = require('../src/shared/dictionary')

const uniqueKeys = {
  NotificationType: [
    'partnerId',
    'name',
    'issueTypeId',
    'jobFunctionId',
    'level',
    'messageTypeId',
  ],
  IssueResolutionTrigger: ['issueTypeId', 'partnerId'],
  IssueEscalationTrigger: ['issueTypeId', 'partnerId', 'escalateToLevel'],
  MessageType: [
    'messageSeverityId',
    'alertTemplateId',
    'smsTemplateId',
    'emailTemplateId',
    'webhookTemplateId',
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
  ],
}

// Helper for seeed files. Ru
let hasSeededStaticData = false
// Set up the file name of the seed with __filename.
function seed(seed, fileName) {
  return {
    seed(knex) {
      return runSeed(seed, knex, fileName).catch(err => {
        console.error(err) // eslint-disable-line no-console
        throw err
      })
    },
  }
}

async function runSeed(seed, knex, fileName) {
  const seedsRun = await getSeedsRan(knex)
  if (!hasSeededStaticData) {
    await seedStaticData(knex)
    hasSeededStaticData = true
  }
  if (fileName) {
    fileName = path.relative(__filename, fileName).slice(3)
  }
  if (fileName && (!seedsRun || !seedsRun[fileName])) {
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
        await knex('AspectSeed').insert({
          fileName,
          success: true,
        })
      })
  }
}

async function rowsAsObject(knex, table, column = 'name') {
  return knex(table).reduce((memo, row) => {
    memo[row[column]] = row
    return memo
  }, {})
}

async function getDefaultMessageTypes(knex) {
  return knex('MessageType as mt')
    .join('IssueType as it', 'it.defaultMessageTypeId', 'mt.id')
    .select('it.externalId as issueTypeExternalId', 'mt.*')
    .reduce((memo, row) => {
      memo[row.issueTypeExternalId] = row
      return memo
    }, {})
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
  const [stockoutAlertTemplateId] = await knex('AlertTemplate').insert(
    Object.assign(
      {
        message:
          'Stock-out expected {{formatDate issue.data.date}} - Order Stock.',
      },
      auditFields
    )
  )

  const [stockoutSmsTemplateId] = await knex('SmsTemplate').insert(
    Object.assign(
      {
        message:
          '{{site.name}}: Stock-out expected {{formatDate issue.data.date}} - Order Stock.',
      },
      auditFields
    )
  )

  const [stockoutEmailTemplateId] = await knex('EmailTemplate').insert(
    Object.assign(
      {
        subject: '{{site.name}} stockout',
        body:
          '{{site.name}}: Stock-out expected {{formatDate issue.data.date}} - Order Stock.',
        htmlBody:
          '<em>{{site.name}}:</em> Stock-out expected {{formatDate issue.data.date}} - Order Stock.',
      },
      auditFields
    )
  )

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
    Object.assign(
      {
        name: 'LU Stockout',
        partnerId,
        issueTypeId: issueTypes.InventoryStockout.id,
        jobFunctionId: jobFunctionIdLabUser,
        level: 1,
        canAcknowledge: 1,
        messageTypeId: defaultMessageTypes.InventoryStockout.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Escalated Stockout',
        partnerId,
        issueTypeId: issueTypes.InventoryStockout.id,
        jobFunctionId: jobFunctionIdLabUser,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.InventoryStockout.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Stockout - RO View',
        partnerId,
        issueTypeId: issueTypes.InventoryStockout.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 1,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.InventoryStockout.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Escalated Stockout - RO View',
        partnerId,
        issueTypeId: issueTypes.InventoryStockout.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.InventoryStockout.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'RO Stockout',
        partnerId,
        issueTypeId: issueTypes.InventoryStockout.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 1,
        canAcknowledge: 1,
        messageTypeId: defaultMessageTypes.InventoryStockout.id,
      },
      auditFields
    ),
    // ------------
    // StockExpiring
    // ------------
    Object.assign(
      {
        name: 'LU Stock Expiring',
        partnerId,
        issueTypeId: issueTypes.InventoryStockExpiring.id,
        jobFunctionId: jobFunctionIdLabUser,
        level: 1,
        canAcknowledge: 1,
        messageTypeId: defaultMessageTypes.InventoryStockExpiring.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Escalated Stock Expiring',
        partnerId,
        issueTypeId: issueTypes.InventoryStockExpiring.id,
        jobFunctionId: jobFunctionIdLabUser,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.InventoryStockExpiring.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Stock Expiring - RO View',
        partnerId,
        issueTypeId: issueTypes.InventoryStockExpiring.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 1,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.InventoryStockExpiring.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Escalated Stock Expiring - RO View',
        partnerId,
        issueTypeId: issueTypes.InventoryStockExpiring.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.InventoryStockExpiring.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'RO Stock Expiring',
        partnerId,
        issueTypeId: issueTypes.InventoryStockExpiring.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 1,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.InventoryStockExpiring.id,
      },
      auditFields
    ),
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
  return knex('Permission').reduce((memo, row) => {
    if (!memo[row.module]) {
      memo[row.module] = {}
    }
    memo[row.module][row.activity] = row.id
    return memo
  }, {})
}

async function seedStaticData(knex) {
  const tables = [
    'DeviceApiRawStatus',
    'FileContentType',
    'IssueCategory',
    'IssueEventStatus',
    'IssueStatusSeverity',
    ['IssueStatus', seedStaticDataIssueStatus],
    'MessageStatus',
    'MessageSeverity',
    'ResultCategory',
    'ResultSource',
    'ResultType',
    'ResultWorkflowStatus',
    'SampleType',
    // TODO ASP-757 Standardize static data key on externalId
    ['AssayType', 'name'],
    ['ConsumableReason', 'name'],
    ['DeviceStatus', 'token'],
    ['PartnerType', 'name'],
    ['DeviceTypeCategory', 'name'],
    ['Unit', 'name'],
    ['Feature', 'module'],
    ['Permission', seedStaticDataPermission],
  ]
  for (const tableItem of tables) {
    /* eslint-disable no-await-in-loop */
    // Need to add in order since some old code relies on hardcoded Ids
    const table = _.isArray(tableItem) ? tableItem[0] : tableItem
    const keyColumn = _.isArray(tableItem) ? tableItem[1] : 'externalId'
    const fixture = await readJson(`./seeds/fixtures/${table}.json`)
    if (_.isFunction(keyColumn)) {
      await keyColumn(knex, fixture)
    } else {
      for (const datum of fixture.data) {
        const existingDatum = await knex(table)
          .where(keyColumn, datum[keyColumn])
          .first('id')
        if (existingDatum == null) {
          await knex(table).insert(datum)
        }
      }
    }
  }
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
      await knex('IssueStatus').insert(
        Object.assign({}, _.omit(status, ['issueStatusSeverity']), {
          issueStatusSeverityId: severities[status.issueStatusSeverity].id,
        })
      )
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
    .reduce((memo, { issueType }) => {
      if (!issueTypeBlacklist.includes(issueType)) {
        memo[issueType] = true
      }
      return memo
    }, {})
  issueTypeWhitelist.forEach(issueType => {
    issueTypeConfigured[issueType] = true
  })

  await Promise.each(
    data,
    async ({ issueType, issueEventStatus, triggerConditions }) => {
      if (issueTypeConfigured[issueType] && issueTypes[issueType]) {
        const triggerData = {
          partnerId,
          issueTypeId: issueTypes[issueType].id,
          issueEventStatusId: issueEventStatuses[issueEventStatus].id,
        }
        const existingTrigger = await knex('IssueEventTrigger')
          .where(triggerData)
          .first('id')
        if (existingTrigger == null) {
          await knex('IssueEventTrigger').insert(
            Object.assign({}, triggerData, {
              triggerConditions: JSON.stringify(triggerConditions),
              createdOn: now,
              updatedOn: now,
            })
          )
        }
      }
    }
  )
}

async function assignAllFeaturesToJobFunctionIds(
  knex,
  jobFunctionIds,
  featureBlacklist = []
) {
  const defaultFeatureBlacklist = [
    // These are currently hardcoded to Myanmar, so skip by default
    'targetDashboard',
    'actionDashboard',
    'reportDashboard',
    'siteFilterDashboard',
  ]
  const features = _.filter(
    await allFeatureToId(),
    (val, key) =>
      !_.includes([...defaultFeatureBlacklist, ...featureBlacklist], key)
  )
  await Promise.all(
    _.map(features, async featureId => {
      await knex('JobFunctionFeature').insert(
        _.map(jobFunctionIds, jobFunctionId => ({
          featureId,
          jobFunctionId,
        }))
      )
    })
  )
}

// ***********************************************************************
// 'whereKeys' is a string with single field name or array with field names
async function upsertItems(knex, tableName, whereKeys, items) {
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
    .where(function() {
      items.forEach(item => {
        this.orWhere(getWhereItem(item, whereKeys))
      })
    })
    .select(...whereKeys)
  // ---------------------
  // insert missing items
  const itemsToInsert = items.filter(
    item => !findItem(existingItems, item, whereKeys)
  )
  if (itemsToInsert.length) {
    await knex(tableName).insert(itemsToInsert)
  }
  // ---------------------
  // update existing items
  const itemsToUpdate = items.filter(item =>
    findItem(existingItems, item, whereKeys)
  )
  if (itemsToUpdate.length) {
    const queries = []
    itemsToUpdate.forEach(item => {
      const query = knex(tableName)
        .where(getWhereItem(item, whereKeys))
        .update(item)
      queries.push(query)
    })
    await Promise.all(queries)
  }
}
// ***********************************************************************
async function upsertSingle(knex, tableName, whereClause, item) {
  if (typeof whereClause === 'string') {
    // single field name which is a primary or unique key, 'item' is required param
    const fieldKey = whereClause
    whereClause = { [fieldKey]: item[fieldKey] }
  } else if (_.isArray(whereClause)) {
    // array of field names, 'item' is required param
    whereClause = _.pick(item, whereClause)
  } else {
    // 'whereClause' is json, if 'item' is missing set it to 'whereClause'
    item = item || whereClause
  }
  const q = knex(tableName).where(whereClause)
  const existingItem = await q.first()
  if (existingItem) {
    await q.clone().update(item)
  } else {
    await knex(tableName).insert(item)
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
    Object.assign(
      {
        name: 'LU Network',
        partnerId,
        issueTypeId: issueTypes.DeviceOffline.id,
        jobFunctionId: jobFunctionIdLabUser,
        level: 1,
        canAcknowledge: 1,
        messageTypeId: defaultMessageTypes.DeviceOffline.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'RO Network',
        partnerId,
        issueTypeId: issueTypes.DeviceOffline.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 2,
        canAcknowledge: 1,
        messageTypeId: defaultMessageTypes.DeviceOffline.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'RO Escalated Network',
        partnerId,
        issueTypeId: issueTypes.DeviceOffline.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 3,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.DeviceOffline.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU No Testing',
        partnerId,
        issueTypeId: issueTypes.DeviceNoResults.id,
        jobFunctionId: jobFunctionIdLabUser,
        level: 1,
        canAcknowledge: 1,
        messageTypeId: defaultMessageTypes.DeviceNoResults.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'RO No Testing',
        partnerId,
        issueTypeId: issueTypes.DeviceNoResults.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 2,
        canAcknowledge: 1,
        messageTypeId: defaultMessageTypes.DeviceNoResults.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'RO Escalated No Testing',
        partnerId,
        issueTypeId: issueTypes.DeviceNoResults.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 3,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.DeviceNoResults.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Module Failure',
        partnerId,
        issueTypeId: issueTypes.ModuleFailureError.id,
        jobFunctionId: jobFunctionIdLabUser,
        level: 2,
        canAcknowledge: 1,
        messageTypeId: defaultMessageTypes.ModuleFailureError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Escalated Module Failure',
        partnerId,
        issueTypeId: issueTypes.ModuleFailureError.id,
        jobFunctionId: jobFunctionIdLabUser,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.ModuleFailureError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Module Temperature',
        partnerId,
        issueTypeId: issueTypes.ModuleTemperatureError.id,
        jobFunctionId: jobFunctionIdLabUser,
        level: 1,
        canAcknowledge: 1,
        messageTypeId: defaultMessageTypes.ModuleTemperatureError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Escalated Module Temperature',
        partnerId,
        issueTypeId: issueTypes.ModuleTemperatureError.id,
        jobFunctionId: jobFunctionIdLabUser,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.ModuleTemperatureError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Module Power',
        partnerId,
        issueTypeId: issueTypes.ModulePowerError.id,
        jobFunctionId: jobFunctionIdLabUser,
        level: 1,
        canAcknowledge: 1,
        messageTypeId: defaultMessageTypes.ModulePowerError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Escalated Module Power',
        partnerId,
        issueTypeId: issueTypes.ModulePowerError.id,
        jobFunctionId: jobFunctionIdLabUser,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.ModulePowerError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Machine Temperature',
        partnerId,
        issueTypeId: issueTypes.MachineTemperatureError.id,
        jobFunctionId: jobFunctionIdLabUser,
        level: 1,
        canAcknowledge: 1,
        messageTypeId: defaultMessageTypes.MachineTemperatureError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Escalated Machine Temperature',
        partnerId,
        issueTypeId: issueTypes.MachineTemperatureError.id,
        jobFunctionId: jobFunctionIdLabUser,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.MachineTemperatureError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Machine Power',
        partnerId,
        issueTypeId: issueTypes.MachinePowerError.id,
        jobFunctionId: jobFunctionIdLabUser,
        level: 1,
        canAcknowledge: 1,
        messageTypeId: defaultMessageTypes.MachinePowerError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Escalated Machine Power',
        partnerId,
        issueTypeId: issueTypes.MachinePowerError.id,
        jobFunctionId: jobFunctionIdLabUser,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.MachinePowerError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Module Procedural',
        partnerId,
        issueTypeId: issueTypes.ModuleProceduralError.id,
        jobFunctionId: jobFunctionIdLabUser,
        level: 1,
        canAcknowledge: 1,
        messageTypeId: defaultMessageTypes.ModuleProceduralError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Escalated Module Procedural',
        partnerId,
        issueTypeId: issueTypes.ModuleProceduralError.id,
        jobFunctionId: jobFunctionIdLabUser,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.ModuleProceduralError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Machine Procedural',
        partnerId,
        issueTypeId: issueTypes.MachineProceduralError.id,
        jobFunctionId: jobFunctionIdLabUser,
        level: 1,
        canAcknowledge: 1,
        messageTypeId: defaultMessageTypes.MachineProceduralError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Escalated Machine Procedural',
        partnerId,
        issueTypeId: issueTypes.MachineProceduralError.id,
        jobFunctionId: jobFunctionIdLabUser,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.MachineProceduralError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'RO Module',
        partnerId,
        issueTypeId: issueTypes.ModuleProceduralError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 1,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.ModuleProceduralError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'RO Machine',
        partnerId,
        issueTypeId: issueTypes.MachineProceduralError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 1,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.MachineProceduralError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Reagent Health',
        partnerId,
        issueTypeId: issueTypes.ReagentHealthError.id,
        jobFunctionId: jobFunctionIdLabUser,
        level: 1,
        canAcknowledge: 1,
        messageTypeId: defaultMessageTypes.ReagentHealthError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Escalated Reagent Health',
        partnerId,
        issueTypeId: issueTypes.ReagentHealthError.id,
        jobFunctionId: jobFunctionIdLabUser,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.ReagentHealthError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'RO Reagent Health',
        partnerId,
        issueTypeId: issueTypes.ReagentHealthError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 1,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.ReagentHealthError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Stock Level Update',
        partnerId,
        issueTypeId: issueTypes.StockLevelUpdate.id,
        jobFunctionId: jobFunctionIdLabUser,
        level: 1,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.StockLevelUpdate.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'RO Stock Level Update',
        partnerId,
        issueTypeId: issueTypes.StockLevelUpdate.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 1,
        canAcknowledge: 1,
        messageTypeId: defaultMessageTypes.StockLevelUpdate.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Data Category Low',
        partnerId,
        issueTypeId: issueTypes.DataCategoryLowError.id,
        jobFunctionId: jobFunctionIdLabUser,
        level: 1,
        canAcknowledge: 1,
        messageTypeId: defaultMessageTypes.DataCategoryLowError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'RO Data Category Low',
        partnerId,
        issueTypeId: issueTypes.DataCategoryLowError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 1,
        canAcknowledge: 1,
        messageTypeId: defaultMessageTypes.DataCategoryLowError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Network - RO View',
        partnerId,
        issueTypeId: issueTypes.DeviceOffline.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 1,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.DeviceOffline.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU No Testing - RO View',
        partnerId,
        issueTypeId: issueTypes.DeviceNoResults.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 1,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.DeviceNoResults.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Module Failure - RO View',
        partnerId,
        issueTypeId: issueTypes.ModuleFailureError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.ModuleFailureError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Escalated Module Failure - RO View',
        partnerId,
        issueTypeId: issueTypes.ModuleFailureError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.ModuleFailureError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Module Temperature - RO View',
        partnerId,
        issueTypeId: issueTypes.ModuleTemperatureError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 1,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.ModuleTemperatureError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Escalated Module Temperature - RO View',
        partnerId,
        issueTypeId: issueTypes.ModuleTemperatureError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.ModuleTemperatureError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Module Power - RO View',
        partnerId,
        issueTypeId: issueTypes.ModulePowerError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 1,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.ModulePowerError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Escalated Module Power - RO View',
        partnerId,
        issueTypeId: issueTypes.ModulePowerError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.ModulePowerError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Machine Temperature - RO View',
        partnerId,
        issueTypeId: issueTypes.MachineTemperatureError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 1,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.MachineTemperatureError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Escalated Machine Temperature - RO View',
        partnerId,
        issueTypeId: issueTypes.MachineTemperatureError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.MachineTemperatureError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Machine Power - RO View',
        partnerId,
        issueTypeId: issueTypes.MachinePowerError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 1,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.MachinePowerError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Escalated Machine Power - RO View',
        partnerId,
        issueTypeId: issueTypes.MachinePowerError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.MachinePowerError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Module Procedural - RO View',
        partnerId,
        issueTypeId: issueTypes.ModuleProceduralError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 1,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.ModuleProceduralError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Escalated Module Procedural - RO View',
        partnerId,
        issueTypeId: issueTypes.ModuleProceduralError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.ModuleProceduralError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Machine Procedural - RO View',
        partnerId,
        issueTypeId: issueTypes.MachineProceduralError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 1,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.MachineProceduralError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Escalated Machine Procedural - RO View',
        partnerId,
        issueTypeId: issueTypes.MachineProceduralError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.MachineProceduralError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Reagent Health - RO View',
        partnerId,
        issueTypeId: issueTypes.ReagentHealthError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 1,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.ReagentHealthError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Escalated Reagent Health - RO View',
        partnerId,
        issueTypeId: issueTypes.ReagentHealthError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.ReagentHealthError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Stock Level Update - RO View',
        partnerId,
        issueTypeId: issueTypes.StockLevelUpdate.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 1,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.StockLevelUpdate.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Data Category Low - RO View',
        partnerId,
        issueTypeId: issueTypes.DataCategoryLowError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 1,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.DataCategoryLowError.id,
      },
      auditFields
    ),
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
      body:
        '{{device.name}}: Errors without code on module {{issue.data.moduleName}}, conduct troubleshooting.',
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
      body:
        '{{device.name}}: Errors without code across machine, conduct troubleshooting.',
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
    Object.assign(
      {
        name: 'LU Module Unknown Error',
        partnerId,
        issueTypeId: moduleIssueTypeId,
        jobFunctionId: jobFunctionIdLabUser,
        level: 1,
        canAcknowledge: 1,
        messageTypeId: moduleMessageTypeId,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Escalated Module Unknown Error',
        partnerId,
        issueTypeId: moduleIssueTypeId,
        jobFunctionId: jobFunctionIdLabUser,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: moduleMessageTypeId,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'RO Escalated Module Unknown Error',
        partnerId,
        issueTypeId: moduleIssueTypeId,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 3,
        canAcknowledge: 0,
        messageTypeId: moduleMessageTypeId,
      },
      auditFields
    ),
    // Module - RO View
    Object.assign(
      {
        name: 'LU Module Unknown Error - RO View',
        partnerId,
        issueTypeId: moduleIssueTypeId,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 1,
        canAcknowledge: 0,
        messageTypeId: moduleMessageTypeId,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Escalated Module Unknown Error - RO View',
        partnerId,
        issueTypeId: moduleIssueTypeId,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: moduleMessageTypeId,
      },
      auditFields
    ),

    // Machine
    Object.assign(
      {
        name: 'LU Machine Unknown Error',
        partnerId,
        issueTypeId: machineIssueTypeId,
        jobFunctionId: jobFunctionIdLabUser,
        level: 1,
        canAcknowledge: 1,
        messageTypeId: machineMessageTypeId,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Escalated Machine Unknown Error',
        partnerId,
        issueTypeId: machineIssueTypeId,
        jobFunctionId: jobFunctionIdLabUser,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: machineMessageTypeId,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'RO Escalated Machine Unknown Error',
        partnerId,
        issueTypeId: machineIssueTypeId,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 3,
        canAcknowledge: 0,
        messageTypeId: machineMessageTypeId,
      },
      auditFields
    ),
    // Machine - RO View
    Object.assign(
      {
        name: 'LU Machine Unknown Error - RO View',
        partnerId,
        issueTypeId: machineIssueTypeId,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 1,
        canAcknowledge: 0,
        messageTypeId: machineMessageTypeId,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Escalated Machine Unknown Error - RO View',
        partnerId,
        issueTypeId: machineIssueTypeId,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: machineMessageTypeId,
      },
      auditFields
    ),
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
      body:
        '{{device.name}}: Possible failure on module {{issue.data.moduleName}} - unknown error - contact engineer',
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
  await knex.schema.alterTable(tableName, table => {
    table.unique(uniqueKeys[tableName], `${tableName}_unique`)
  })
}
async function dropUniqueKey(knex, tableName) {
  await Promise.all(
    _.map(foreignKeys[tableName], async ({ column }) => {
      await knex.schema.table(tableName, table => {
        table.dropForeign(column)
      })
    })
  )

  await knex.schema.alterTable(tableName, table => {
    table.dropUnique(uniqueKeys[tableName], `${tableName}_unique`)
  })

  await Promise.all(
    _.map(foreignKeys[tableName], async ({ column, reference }) => {
      await knex.schema.table(tableName, table => {
        table.foreign(column).references(reference)
      })
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
      ['Detected', 'Trace Detected', 'MoreThan1000', 'Resistant'].indexOf(
        externalId
      ) >= 0
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
      ].indexOf(externalId) >= 0
    ) {
      json = {
        requiresTreatment: false,
        emphasize: true,
      }
    } else if (
      ['Success', 'LessThan1000', 'Unknown', 'NotDetected'].indexOf(
        externalId
      ) >= 0
    ) {
      json = {
        requiresTreatment: false,
        emphasize: false,
      }
    }
    await knex('ResultCategoryAssay')
      .where('resultCategoryId', id)
      .update(json)
  })
}

async function updateAssayAbbreviation(knex) {
  const categories = await knex('ResultCategory').select(
    'id',
    'name',
    'externalId'
  )

  await Promise.each(categories, async ({ id, externalId }) => {
    let json
    if (
      ['Detected', 'Trace Detected', 'MoreThan1000'].indexOf(externalId) >= 0
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
      ].indexOf(externalId) >= 0
    ) {
      json = {
        requiresTreatment: false,
        emphasize: true,
      }
    } else if (
      ['Success', 'LessThan1000', 'Unknown', 'NotDetected'].indexOf(
        externalId
      ) >= 0
    ) {
      json = {
        requiresTreatment: false,
        emphasize: false,
      }
    }
    await knex('ResultCategoryAssay')
      .where('resultCategoryId', id)
      .update(json)
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

async function addDeviceCapacities(knex) {
  const { data: deviceCapacitiesByPartner } = await readJson(
    `./seeds/fixtures/DeviceCapacity.json`
  )

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
        await knex('DeviceCapacity').insert(
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

  const deviceCapacities = await knex('DeviceCapacity')
    .where('defaultForDeviceType', 1)
    .select('id', 'partnerId', 'deviceTypeId')
  await Promise.each(devices, async ({ partnerId, deviceTypeId }) => {
    const deviceCapacityByPartnerId = _.find(
      deviceCapacities,
      dc => dc.partnerId === partnerId && dc.deviceTypeId === deviceTypeId
    )
    if (deviceCapacityByPartnerId) {
      await knex('Device')
        .where({ partnerId })
        .where({ deviceTypeId })
        .update({ deviceCapacityId: deviceCapacityByPartnerId.id })
    }
  })
}
async function getSeedsRan(knex) {
  return knex('AspectSeed as ap')
    .where({ success: true })
    .select('ap.fileName')
    .reduce((memo, row) => {
      if (!memo[row.fileName]) {
        memo[row.fileName] = true
      }
      return memo
    }, {})
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

module.exports = {
  seed,
  getSeedsRan,
  rowsAsObject,
  getDefaultMessageTypes,
  seedStockIssues,
  seedStockIssuesUpdate,
  getPermissionModules,
  seedIssueEventTriggersForPartner,
  assignAllFeaturesToJobFunctionIds,
  upsertItems,
  upsertSingle,
  seedIssues,

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
  updateAssayAbbreviation,
}
