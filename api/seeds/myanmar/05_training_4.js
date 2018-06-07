module.exports = require('../../src/db').seed(seed)
const { getDefaultMessageTypes } = require('../utils')

async function seed(knex) {
  const defaultMessageTypes = await getDefaultMessageTypes(knex)

  await knex('AlertTemplate')
    .where({ id: defaultMessageTypes.DeviceOffline.alertTemplateId })
    .update({
      message: 'Cannot reach network for {{numberOfDays device.lastPingOn}}',
    })
  await knex('SmsTemplate')
    .where({ id: defaultMessageTypes.DeviceOffline.smsTemplateId })
    .update({
      message:
        '{{site.name}} cannot reach network for {{numberOfDays device.lastPingOn}}',
    })
  await knex('EmailTemplate')
    .where({ id: defaultMessageTypes.DeviceOffline.emailTemplateId })
    .update({
      subject:
        '{{site.name}} cannot reach network for {{numberOfDays device.lastPingOn}}',
      body:
        '{{site.name}} cannot reach network for {{numberOfDays device.lastPingOn}}',
      htmlBody:
        '<em>{{site.name}}</em> cannot reach network for {{numberOfDays device.lastPingOn}}',
    })

  await knex('AlertTemplate')
    .where({ id: defaultMessageTypes.DeviceNoResults.alertTemplateId })
    .update({
      message: 'No testing for {{numberOfDays issue.data.lastResultOn}}',
    })
  await knex('SmsTemplate')
    .where({ id: defaultMessageTypes.DeviceNoResults.smsTemplateId })
    .update({
      message:
        '{{site.name}} no testing for {{numberOfDays issue.data.lastResultOn}}',
    })
  await knex('EmailTemplate')
    .where({ id: defaultMessageTypes.DeviceNoResults.emailTemplateId })
    .update({
      subject: '{{site.name}} No Testing',
      body: '{{site.name}} no testing {{numberOfDays issue.data.lastResultOn}}',
      htmlBody:
        '<em>{{site.name}}</em> no testing for {{numberOfDays issue.data.lastResultOn}}',
    })

  await knex('AlertTemplate')
    .where({ id: defaultMessageTypes.DeviceMaintenance.alertTemplateId })
    .update({
      message: 'Under Maintenance',
    })
  await knex('SmsTemplate')
    .where({ id: defaultMessageTypes.DeviceMaintenance.smsTemplateId })
    .update({
      message: '{{site.name}} under maintenance.',
    })
  await knex('EmailTemplate')
    .where({ id: defaultMessageTypes.DeviceMaintenance.emailTemplateId })
    .update({
      subject: '{{site.name}} Maintenance',
      body: '{{site.name}} under maintenance.',
      htmlBody: '<em>{{site.name}}</em> maintenance',
    })

  await knex('AlertTemplate')
    .where({ id: defaultMessageTypes.ModuleProceduralError.alertTemplateId })
    .update({
      message: 'Module {{result.moduleName}} errors, conduct troubleshooting',
    })

  // turn off email/sms temporarily
  await knex('MessageType').update({
    emailTemplateId: null,
    smsTemplateId: null,
  })
}
