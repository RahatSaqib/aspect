module.exports = require('../../src/db').seed(seed)
const { rowsAsObject } = require('../utils')

const now = new Date()

async function seed(knex) {
  const { id: partnerId } = await knex('Partner')
    .where({ name: 'Myanmar' })
    .first()
  const issueTypes = await rowsAsObject(knex, 'IssueType', 'externalId')

  // Issue Resolution Triggers
  await knex('IssueResolutionTrigger').insert([
    {
      issueTypeId: issueTypes.DeviceOffline.id,
      partnerId,
      resolutionConditions: JSON.stringify({
        evaluationMethod: 'sql-script',
        evaluationParameter:
          './sqlScripts/Myanmar/issues/resolutions/deviceOfflineLUNetwork.sql',
      }),
      createdOn: now,
      updatedOn: now,
    },
  ])

  // Assign ULTRA assay to TB cartridge consumable:
  const { id: assayIdUltra } = await knex('Assay')
    .where('externalId', 'GxMtbRifUltra')
    .first()

  const { id: consumableIdTb } = await knex('Consumable')
    .where('name', 'GeneXpert TB Cartridge')
    .first()

  await knex('ConsumableAssay')
    .where('assayId', assayIdUltra)
    .update('consumableId', consumableIdTb)

  await seedStockIssues(knex)
}

async function seedStockIssues(knex) {
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
    // rowsAsObject(knex, 'IssueType', 'externalId'),
    rowsAsObject(knex, 'IssueCategory', 'externalId'),
    rowsAsObject(knex, 'MessageSeverity', 'externalId'),
  ])

  // ---------------------------------
  // Inventory Stockout Issue
  // ---------------------------------
  const [stockoutAlertTemplateId] = await knex('AlertTemplate').insert(
    /* eslint-disable no-template-curly-in-string */
    Object.assign(
      {
        message: 'Stock-out expected {{date}} - Order Stock.',
      },
      auditFields
    )
  )

  const [stockoutSmsTemplateId] = await knex('SmsTemplate').insert(
    /* eslint-disable no-template-curly-in-string */
    Object.assign(
      {
        message: '{{site.name}}: Stock-out expected {{date}} - Order Stock.',
      },
      auditFields
    )
  )

  const [stockoutEmailTemplateId] = await knex('EmailTemplate').insert(
    /* eslint-disable no-template-curly-in-string */
    Object.assign(
      {
        subject: '{{site.name}} stockout',
        body: '{{site.name}}: Stock-out expected {{date}} - Order Stock.',
        htmlBody:
          '<em>{{site.name}}:</em> Stock-out expected {{date}} - Order Stock.',
      },
      auditFields
    )
  )

  // ---------------------------------
  // Inventory Stock Expiring Issue
  // ---------------------------------
  const messageStockExpiring =
    '{{totalWasted}} consumables likely to expire in {{numberOfDays}} days.'
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

  await knex('Partner')
    .where({ id: partnerId })
    .update({
      dueDaysInventoryStockout: 30,
      dueDaysInventoryStockExpiring: 30,
    })

  const [issueTypes] = await Promise.all([
    rowsAsObject(knex, 'IssueType', 'externalId'),
  ])

  // Issue Escalation Triggers
  await knex('IssueEscalationTrigger').insert([
    // Inventory Stockout escalation
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
    // Inventory Stock Expiring escalation
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
