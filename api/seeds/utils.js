const _ = require('lodash')
const { readJson } = require('fs-extra')

// Helper for seeed files. Ru
let hasSeededStaticData = false
function seed(seed) {
  return {
    seed(knex) {
      return runSeed(seed, knex).catch(err => {
        console.error(err) // eslint-disable-line no-console
        throw err
      })
    },
  }
}
async function runSeed(seed, knex) {
  if (!hasSeededStaticData) {
    await seedStaticData(knex)
    hasSeededStaticData = true
  }
  return seed(knex)
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

  const { id: adminId } = await knex('User as u')
    .where({ 'u.name': 'myanmar_admin' })
    .first('u.id')

  const now = new Date()
  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
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
        message: 'Stock-out expected {{issue.data.date}} - Order Stock.',
      },
      auditFields
    )
  )

  const [stockoutSmsTemplateId] = await knex('SmsTemplate').insert(
    Object.assign(
      {
        message:
          '{{site.name}}: Stock-out expected {{issue.data.date}} - Order Stock.',
      },
      auditFields
    )
  )

  const [stockoutEmailTemplateId] = await knex('EmailTemplate').insert(
    Object.assign(
      {
        subject: '{{site.name}} stockout',
        body:
          '{{site.name}}: Stock-out expected {{issue.data.date}} - Order Stock.',
        htmlBody:
          '<em>{{site.name}}:</em> Stock-out expected {{issue.data.date}} - Order Stock.',
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

  const stockoutMessageTypeId = await knex('MessageType').insert(
    {
      messageSeverityId: messageSeverities.Alert.id,
      alertTemplateId: stockoutAlertTemplateId,
      smsTemplateId: stockoutSmsTemplateId,
      emailTemplateId: stockoutEmailTemplateId,
    },
    'id'
  )
  const stockExpiringMessageTypeId = await knex('MessageType').insert(
    {
      messageSeverityId: messageSeverities.Alert.id,
      alertTemplateId: stockExpiringAlertTemplateId,
      smsTemplateId: stockExpiringSmsTemplateId,
      emailTemplateId: stockExpiringEmailTemplateId,
    },
    'id'
  )

  await knex('IssueType').insert([
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
  await knex('NotificationType').insert([
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
  await knex('IssueEscalationTrigger').insert([
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

  await Promise.all(
    data.map(async ({ issueType, issueEventStatus, triggerConditions }) => {
      if (issueTypeConfigured[issueType]) {
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
    })
  )
}

module.exports = {
  seed,
  rowsAsObject,
  getDefaultMessageTypes,
  seedStockIssues,
  getPermissionModules,
  seedIssueEventTriggersForPartner,
}
