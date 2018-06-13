module.exports = require('../../src/db').seed(seed)
const { getDefaultMessageTypes } = require('../utils')

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
}
