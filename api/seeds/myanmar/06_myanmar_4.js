module.exports = require('../../src/db').seed(seed)
const { getDefaultMessageTypes } = require('../utils')
const { rowsAsObject } = require('../utils')

async function seed(knex) {
  const defaultMessageTypes = await getDefaultMessageTypes(knex)

  await knex('AlertTemplate')
    .where({ id: defaultMessageTypes.ModuleTemperatureError.alertTemplateId })
    .update({
      message:
        'Temperature errors on Module {{issue.data.moduleName}}; notify RO',
    })

  await knex('SmsTemplate')
    // SMS and Email templates have been set to null, so this doesn't work
    // .where({ id: defaultMessageTypes.ModuleTemperatureError.smsTemplateId })
    .where({
      message:
        '{{device.name}} has Temperature errors on Module {{result.moduleName}}; notify RO.',
    })
    .update({
      message:
        '{{device.name}} has Temperature errors on Module {{issue.data.moduleName}}; notify RO.',
    })

  await knex('EmailTemplate')
    .where({
      subject:
        '{{device.name}} has Temperature errors on Module {{result.moduleName}}; notify RO.',
    })
    .update({
      subject:
        '{{device.name}} has Temperature errors on Module {{issue.data.moduleName}}; notify RO.',
      body:
        '{{device.name}} has Temperature errors on Module {{issue.data.moduleName}}; notify RO.',
      htmlBody:
        '<em>{{device.name}}</em> has Temperature errors on Module {{issue.data.moduleName}}; notify RO.',
    })

  await knex('AlertTemplate')
    .where({ id: defaultMessageTypes.ModulePowerError.alertTemplateId })
    .update({
      message: 'Power errors on Module {{issue.data.moduleName}}; notify RO',
    })

  await knex('SmsTemplate')
    .where({
      message: 'Power errors on Module {{result.moduleName}}; notify RO',
    })
    .update({
      message: 'Power errors on Module {{issue.data.moduleName}}; notify RO',
    })

  await knex('EmailTemplate')
    .where({ subject: '{{result.moduleName}} Power Errors' })
    .update({
      subject: '{{issue.data.moduleName}} Power Errors',
      body: 'Power errors on Module {{issue.data.moduleName}}; notify RO',
      htmlBody: 'Power errors on <em>{{issue.data.moduleName}}</em> notify RO',
    })

  await knex('AlertTemplate')
    .where({ id: defaultMessageTypes.ModuleFailureError.alertTemplateId })
    .update({
      message: 'Module {{issue.data.moduleName}}: Critical errors; notify R.O.',
    })

  await knex('SmsTemplate')
    .where({
      message: 'Module {{result.moduleName}}: Critical errors; notify R.O.',
    })
    .update({
      message: 'Module {{issue.data.moduleName}}: Critical errors; notify R.O.',
    })

  await knex('EmailTemplate')
    .where({
      body: 'Module {{result.moduleName}}: Critical errors; notify R.O.',
    })
    .update({
      subject: 'Module Failure Errors',
      body: 'Module {{issue.data.moduleName}}: Critical errors; notify R.O.',
      htmlBody:
        'Module <em>{{issue.data.moduleName}}</em>: Critical errors; notify R.O.',
    })

  await knex('AlertTemplate')
    .where({ id: defaultMessageTypes.ModuleProceduralError.alertTemplateId })
    .update({
      message:
        'Module {{issue.data.moduleName}} errors, conduct troubleshooting',
    })

  await knex('SmsTemplate')
    .where({
      message: 'Module {{result.moduleName}} errors, conduct troubleshooting',
    })
    .update({
      message:
        'Module {{issue.data.moduleName}} errors, conduct troubleshooting',
    })

  await knex('EmailTemplate')
    .where({
      body: 'Module {{result.moduleName}} errors, conduct troubleshooting',
    })
    .update({
      subject: 'Procedural Module Errors',
      body: 'Module {{issue.data.moduleName}} errors, conduct troubleshooting',
      htmlBody:
        'Module <em>{{issue.data.moduleName}}</em> errors, conduct troubleshooting',
    })

  await knex('Permission').insert({
    module: 'browse',
    activity: 'view',
  })

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
  const [issueTypes, issueCategories, messageSeverities] = await Promise.all([
    rowsAsObject(knex, 'IssueType', 'externalId'),
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
}
