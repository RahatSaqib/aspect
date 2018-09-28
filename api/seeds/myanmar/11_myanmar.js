module.exports = require('../utils').seed(seed)

const { rowsAsObject } = require('../utils')
const { seedDataCategory } = require('../dataCategoryLow')

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

  await seedReagentHealthResolution(knex)
  await updateDashboardWidgetToIncludeTrace(knex)
  await seedDataCategory(knex, 'Myanmar')
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
