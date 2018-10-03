module.exports = require('../utils').seed(seed)

const { seedDataCategory } = require('../dataCategoryLow')
const { rowsAsObject, seedStockIssuesUpdate } = require('../utils')
const {
  updateUnknownErrorOnModuleMessage,
} = require('../seedUnknownErrorsIssue')

async function seed(knex) {
  // check if seed already ran:
  const issueTypes = await rowsAsObject(knex, 'IssueType', 'externalId')

  const reagentHealthResolution = await knex('IssueResolutionTrigger')
    .where({
      issueTypeId: issueTypes.ReagentHealthError.id,
    })
    .first()

  if (reagentHealthResolution != null) {
    return
  }

  await seedStockIssuesUpdate(knex, 'Myanmar')
  await seedReagentHealthResolution(knex)
  await updateTemplatesToIncludeDeviceName(knex)
  await updateDashboardWidgetToIncludeTrace(knex)
  await seedDataCategory(knex, 'Myanmar')
  await updateUnknownErrorOnModuleMessage(knex)
}

async function seedReagentHealthResolution(knex) {
  const issueTypes = await rowsAsObject(knex, 'IssueType', 'externalId')

  const now = new Date()
  const { id: partnerId } = await knex('Partner')
    .where({ name: 'Myanmar' })
    .first()

  await knex('IssueResolutionTrigger').insert({
    issueTypeId: issueTypes.ReagentHealthError.id,
    partnerId,
    resolutionConditions: JSON.stringify({
      evaluationMethod: 'plugin-function',
      evaluationParameter: 'resolveReagentHealthError',
    }),
    createdOn: now,
    updatedOn: now,
  })
}

async function updateTemplatesToIncludeDeviceName(knex) {
  await knex('SmsTemplate')
    .where({
      message: 'Power errors on Module {{issue.data.moduleName}}; notify RO',
    })
    .update({
      message:
        '{{device.name}} has power errors on Module {{issue.data.moduleName}}; notify RO',
    })
  await knex('EmailTemplate')
    .where({ subject: '{{issue.data.moduleName}} Power Errors' })
    .update({
      subject:
        '{{device.name}} has power errors on module {{issue.data.moduleName}}',
      body:
        '{{device.name}} has power errors on module {{issue.data.moduleName}}; notify RO',
      htmlBody:
        '{{device.name}} has power errors on module <em>{{issue.data.moduleName}}</em>; notify RO',
    })

  await knex('SmsTemplate')
    .where({
      message: 'Module {{issue.data.moduleName}}: Critical errors; notify R.O.',
    })
    .update({
      message:
        'Module {{issue.data.moduleName}} in {{device.name}}: Critical errors; notify RO',
    })
  await knex('EmailTemplate')
    .where({ subject: 'Module Failure Errors' })
    .update({
      subject: '{{device.name}}: Critical Module Errors',
      body:
        'Module {{issue.data.moduleName}} in {{device.name}}: Critical errors; notify RO',
      htmlBody:
        'Module <em>{{issue.data.moduleName}}</em> in {{device.name}}: Critical errors; notify RO',
    })

  await knex('SmsTemplate')
    .where({
      message:
        '{{site.name}} no testing for {{numberOfDays issue.data.lastResultOn}}',
    })
    .update({
      message:
        '{{device.name}} no testing for {{numberOfDays issue.data.lastResultOn}}',
    })
  await knex('EmailTemplate')
    .where({ subject: '{{site.name}} No Testing' })
    .update({
      subject: '{{device.name}}: No Testing',
      body:
        '{{device.name}} no testing {{numberOfDays issue.data.lastResultOn}}',
      htmlBody:
        '<em>{{device.name}}</em> no testing for {{numberOfDays issue.data.lastResultOn}}',
    })

  await knex('SmsTemplate')
    .where({
      message: 'Temperature errors across machine, conduct troubleshooting.',
    })
    .update({
      message:
        '{{device.name}}: Temperature errors across machine, conduct troubleshooting',
    })
  await knex('EmailTemplate')
    .where({ subject: 'Machine Temperature Errors' })
    .update({
      subject: '{{device.name}}: Machine Temperature Errors',
      body:
        '{{device.name}}: Temperature errors across machine, conduct troubleshooting.',
      htmlBody:
        '<em>{{device.name}}</em>: Temperature errors across machine, conduct troubleshooting.',
    })

  await knex('SmsTemplate')
    .where({ message: 'Power error across machine, conduct troubleshooting' })
    .update({
      message:
        '{{device.name}}: Power error across machine, conduct troubleshooting.',
    })
  await knex('EmailTemplate')
    .where({ subject: 'Power error across machine' })
    .update({
      subject: '{{device.name}}: Power error across machine',
      body:
        '{{device.name}}: Power error across machine, conduct troubleshooting.',
      htmlBody:
        '<em>{{device.name}}</em>: Power error across machine, conduct troubleshooting.',
    })

  await knex('SmsTemplate')
    .where({
      message: 'Procedural errors across machine, conduct troubleshooting',
    })
    .update({
      message:
        '{{device.name}}: Procedural errors across machine, conduct troubleshooting',
    })
  await knex('EmailTemplate')
    .where({ subject: 'Procedural Errors' })
    .update({
      subject: '{{device.name}}: Procedural Errors',
      body:
        '{{device.name}}: Procedural errors across machine, conduct troubleshooting.',
      htmlBody:
        '<em>{{device.name}}</em>: Procedural errors across machine, conduct troubleshooting.',
    })

  await knex('SmsTemplate')
    .where({ message: '{{site.name}} - Cartridge-specific errors exceed 5%' })
    .update({
      message: '{{device.name}} - Cartridge-specific errors exceed 5%',
    })
  await knex('EmailTemplate')
    .where({ subject: '{{site.name}} - Cartridge-specific errors exceed 5%' })
    .update({
      subject: '{{device.name}} - Cartridge-specific errors exceed 5%',
      body: '{{device.name}} - Cartridge-specific errors exceed 5%',
      htmlBody: '{{device.name}} - Cartridge-specific errors exceed 5%',
    })

  await knex('SmsTemplate')
    .where({
      message:
        'Errors without code on module {{issue.data.moduleName}}, conduct troubleshooting.',
    })
    .update({
      message:
        '{{device.name}}: Errors without code on module {{issue.data.moduleName}}, conduct troubleshooting.',
    })
  await knex('EmailTemplate')
    .where({ subject: '{{issue.data.moduleName}} Errors without code' })
    .update({
      subject:
        '{{device.name}}: Errors without code on module {{issue.data.moduleName}}',
      body:
        '{{device.name}}: Errors without code on module {{issue.data.moduleName}}, conduct troubleshooting.',
      htmlBody:
        '{{device.name}}: Errors without code on module <em>{{issue.data.moduleName}}</em>, conduct troubleshooting.',
    })

  await knex('SmsTemplate')
    .where({
      message: 'Errors without code across machine, conduct troubleshooting',
    })
    .update({
      message:
        '{{device.name}}: Errors without code across machine, conduct troubleshooting.',
    })
  await knex('EmailTemplate')
    .where({ subject: 'Errors without code across machine' })
    .update({
      subject: '{{device.name}}: Errors without code across machine',
      body:
        '{{device.name}}: Errors without code across machine, conduct troubleshooting.',
      htmlBody:
        '{{device.name}}: Errors without code across machine, conduct troubleshooting.',
    })

  await knex('SmsTemplate')
    .where({
      message:
        'Possible module failure on module {{issue.data.moduleName}} contact engineer',
    })
    .update({
      message:
        '{{device.name}}: Possible module failure on module {{issue.data.moduleName}} contact engineer',
    })
  await knex('EmailTemplate')
    .where({ subject: 'Possible module failure' })
    .update({
      subject: '{{device.name}}: Possible module failure',
      body:
        '{{device.name}}: Possible module failure on module {{issue.data.moduleName}} contact engineer',
      htmlBody:
        '{{device.name}}: Possible module failure on module <em>{{issue.data.moduleName}}</em> contact engineer',
    })

  await knex('SmsTemplate')
    .where({
      message:
        '{{device.name}} has Temperature errors on Module {{issue.data.moduleName}}; notify RO.',
    })
    .update({
      message:
        '{{device.name}} has Temperature errors on Module {{issue.data.moduleName}}; notify RO',
    })

  await knex('EmailTemplate')
    .where({
      subject:
        '{{device.name}} has Temperature errors on Module {{issue.data.moduleName}}; notify RO.',
    })
    .update({
      subject:
        '{{device.name}} has Temperature errors on Module {{issue.data.moduleName}}',
      body:
        '{{device.name}} has Temperature errors on Module {{issue.data.moduleName}}; notify RO.',
      htmlBody:
        '<em>{{device.name}}</em> has Temperature errors on Module {{issue.data.moduleName}}; notify RO.',
    })
}

async function updateDashboardWidgetToIncludeTrace(knex) {
  await knex('DashboardWidget')
    .where({ title: 'RR Rate' })
    .update({
      sqlForIndicator:
        "SELECT ifnull(concat(round(sum(CASE WHEN f.resultCategory2=1 AND f.resultCategory1 in (1,2) THEN f.resultCount ELSE 0 END)/sum(CASE WHEN f.resultCategory1 in (1,2) THEN f.resultCount ELSE 0 END) * 100, 0), '%'), '0%') AS cnt FROM FactResultsDeviceByCategory1And2 AS f INNER JOIN Device AS d ON d.id = f.deviceId INNER JOIN Site AS s ON s.id = d.siteId INNER JOIN Partner AS p ON s.partnerId = p.id LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id WHERE f.assayId IN (1,2) AND f.days = 30",
    })

  await knex('DashboardWidgetStat')
    .where({ statUnitI18nKey: 'dashboardWidgetUnitRRRate' })
    .update({
      sqlForStatUnit:
        'select ifnull(sum(f.resultCount), 0) as cnt from FactResultsDeviceByCategory1 as f inner join Device as d on d.id = f.deviceId inner join Site as s on s.id = d.siteId inner join Partner as p on s.partnerId = p.id left outer join Geography as g on s.geographyId = g.id where f.resultCategory1 in (1,2) and f.assayId in (1,2) and f.days = 30',
    })

  await knex('DashboardWidget')
    .where({ title: 'TI Rate' })
    .update({
      sqlForIndicator:
        "SELECT ifnull(concat(round(sum(CASE WHEN f.resultCategory2=4 AND f.resultCategory1 in (1,2) THEN f.resultCount ELSE 0 END)/sum(CASE WHEN f.resultCategory1 in (1,2) THEN f.resultCount ELSE 0 END) * 100, 0), '%'), '0%') AS cnt FROM FactResultsDeviceByCategory1And2 AS f INNER JOIN Device AS d ON d.id = f.deviceId INNER JOIN Site AS s ON s.id = d.siteId INNER JOIN Partner AS p ON s.partnerId = p.id LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id WHERE f.assayId IN (1,2) AND f.days = 30",
    })

  await knex('DashboardWidgetStat')
    .where({ statUnitI18nKey: 'dashboardWidgetUnitTIRate' })
    .update({
      sqlForStatUnit:
        'select ifnull(sum(f.resultCount), 0) as cnt from FactResultsDeviceByCategory1 as f inner join Device as d on d.id = f.deviceId inner join Site as s on s.id = d.siteId inner join Partner as p on s.partnerId = p.id left outer join Geography as g on s.geographyId = g.id where f.resultCategory1 in (1,2) and f.assayId in (1,2) and f.days = 30',
    })
}
