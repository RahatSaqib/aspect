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

  // adjust calculation for MDR-TB
  await knex('DashboardWidget')
    .where({ title: 'MDR-TB' })
    .update({
      sqlForIndicator:
        "select ifnull(count(r.id), 0) as cnt from Result as r inner join Device as d on d.id = r.deviceId inner join Site as s on s.id = d.siteId inner join Partner p on s.partnerId = p.id left outer join Geography as g on s.geographyId = g.id inner join Assay as a on a.id = r.assayId where (ifnull(patientData ->> '$.previouslyTreated', '') = 'Yes' or ifnull(patientData ->> '$.previouslyTreated', '') = 'true') and ifnull(patientData ->> '$.hivStatus', '') != 'HIV Positive' and ifnull(patientData ->> '$.microscopyResult', '') not like '%Positive' and cast(ifnull(patientData ->> '$.age', 100) as UNSIGNED) >= 18 and r.assayId in (1,2)",
    })

  await knex('DashboardWidgetTarget')
    .where({ targetToken: 'MDR' })
    .update({
      sqlForDataCollection:
        "select concat(round(sum(case when ifnull(patientData ->> '$.previouslyTreated', '') != '' then 1 else 0 end)/count(r.id)*100,0),'%') as cnt from Result as r inner join Device as d on d.id = r.deviceId inner join Site as s on s.id = d.siteId inner join Partner as p on s.partnerId = p.id left outer join Geography as g on s.geographyId = g.id where r.assayId in (1,2)",
    })

  // reformat queries using the "->>" operator
  await knex('DashboardWidget')
    .where({ title: 'HIV+' })
    .update({
      sqlForIndicator:
        "select ifnull(count(r.id), 0) as cnt from Result as r inner join Device as d on d.id = r.deviceId inner join Site as s on s.id = d.siteId inner join Partner p on s.partnerId = p.id left outer join Geography as g on s.geographyId = g.id inner join Assay as a on a.id = r.assayId where ifnull(patientData ->> '$.hivStatus', '') = 'HIV Positive' and r.assayId in (1,2)",
    })

  await knex('DashboardWidgetTarget')
    .where({ targetToken: 'HIV' })
    .update({
      sqlForDataCollection:
        "select concat(round(sum(case when ifnull(patientData ->> '$.hivStatus', '') != '' then 1 else 0 end)/count(r.id)*100,0),'%') as cnt from Result as r inner join Device as d on d.id = r.deviceId inner join Site as s on s.id = d.siteId inner join Partner as p on s.partnerId = p.id left outer join Geography as g on s.geographyId = g.id where r.assayId in (1,2)",
    })

  await knex('DashboardWidget')
    .where({ title: 'Smear+' })
    .update({
      sqlForIndicator:
        "select ifnull(count(r.id), 0) as cnt from Result as r inner join Device as d on d.id = r.deviceId inner join Site as s on s.id = d.siteId inner join Partner p on s.partnerId = p.id left outer join Geography as g on s.geographyId = g.id inner join Assay as a on a.id = r.assayId where ifnull(patientData ->> '$.microscopyResult', '') LIKE '%Positive' and r.assayId in (1,2)",
    })

  await knex('DashboardWidgetTarget')
    .where({ targetToken: 'Smear' })
    .update({
      sqlForDataCollection:
        "select concat(round(sum(case when ifnull(patientData ->> '$.microscopyResult', '') != '' then 1 else 0 end)/count(r.id)*100,0),'%') as cnt from Result as r inner join Device as d on d.id = r.deviceId inner join Site as s on s.id = d.siteId inner join Partner as p on s.partnerId = p.id left outer join Geography as g on s.geographyId = g.id where r.assayId in (1,2)",
    })

  await knex('DashboardWidget')
    .where({ title: 'Children' })
    .update({
      sqlForIndicator:
        "select ifnull(count(r.id), 0) as cnt from Result as r inner join Device as d on d.id = r.deviceId inner join Site as s on s.id = d.siteId inner join Partner p on s.partnerId = p.id left outer join Geography as g on s.geographyId = g.id inner join Assay as a on a.id = r.assayId where cast(ifnull(patientData ->>  '$.age', 100) as UNSIGNED) < 18 and r.assayId in (1,2)",
    })

  await knex('DashboardWidgetTarget')
    .where({ targetToken: 'Children' })
    .update({
      sqlForDataCollection:
        "select concat(round(sum(case when ifnull(patientData ->> '$.age', 'null') != 'null' then 1 else 0 end)/count(r.id)*100,0),'%') as cnt from Result as r inner join Device as d on d.id = r.deviceId inner join Site as s on s.id = d.siteId inner join Partner as p on s.partnerId = p.id left outer join Geography as g on s.geographyId = g.id where r.assayId in (1,2)",
    })
}
