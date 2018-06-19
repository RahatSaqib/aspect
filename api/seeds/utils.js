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
        message: 'Stock-out expected {{date}} - Order Stock.',
      },
      auditFields
    )
  )

  const [stockoutSmsTemplateId] = await knex('SmsTemplate').insert(
    Object.assign(
      {
        message: '{{site.name}}: Stock-out expected {{date}} - Order Stock.',
      },
      auditFields
    )
  )

  const [stockoutEmailTemplateId] = await knex('EmailTemplate').insert(
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

module.exports = {
  rowsAsObject,
  getDefaultMessageTypes,
  seedStockIssues,
}
