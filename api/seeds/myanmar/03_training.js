module.exports = require('../../src/db').seed(seed)

const geography = require('./fixtures/geography.json')
const _ = require('lodash')

async function seed(knex) {
  // remove decimals from target data collection
  await knex('DashboardWidgetTarget').update({
    sqlForDataCollection: knex.raw(
      "replace(sqlForDataCollection, '100,2),', '100,0),')"
    ),
  })

  // adjust RR rate to be a percentage
  await knex('DashboardWidget')
    .where({ title: 'RR Rate' })
    .update({
      sqlForIndicator:
        "SELECT ifnull(concat(round(sum(CASE WHEN f.resultCategory2=1 AND f.resultCategory1 = 1 THEN f.resultCount ELSE 0 END)/sum(CASE WHEN f.resultCategory1 = 1 THEN f.resultCount ELSE 0 END) * 100, 0), '%'), '0%') AS cnt FROM FactResultsDeviceByCategory1And2 AS f INNER JOIN Device AS d ON d.id = f.deviceId INNER JOIN Site AS s ON s.id = d.siteId INNER JOIN Partner AS p ON s.partnerId = p.id LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id WHERE f.assayId IN (1,2) AND f.days = 30",
    })

  // Change TI subtitle
  await knex('DashboardWidgetStat')
    .where({ statStatus: 'Trace Indet.' })
    .update({
      statStatus: 'Indeterminate',
    })

  // Change TI calculation
  await knex('DashboardWidget')
    .where({ title: 'TI Rate' })
    .update({
      sqlForIndicator:
        "SELECT ifnull(concat(round(sum(CASE WHEN f.resultCategory2=4 AND f.resultCategory1 = 1 THEN f.resultCount ELSE 0 END)/sum(CASE WHEN f.resultCategory1 = 1 THEN f.resultCount ELSE 0 END) * 100, 0), '%'), '0%') AS cnt FROM FactResultsDeviceByCategory1And2 AS f INNER JOIN Device AS d ON d.id = f.deviceId INNER JOIN Site AS s ON s.id = d.siteId INNER JOIN Partner AS p ON s.partnerId = p.id LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id WHERE f.assayId IN (1,2) AND f.days = 30",
    })

  // update Targets for the states with real values
  await Promise.all(
    _.map(geography.countries[0].states, async state => {
      const geography = await knex('Geography')
        .join('State', 'Geography.stateId', 'State.id')
        .whereNotNull('stateId')
        .whereNull('lgaId')
        .where('State.name', state.name)
        .first('Geography.id')

      await Promise.all(
        _.map(state.targets, async (value, key) => {
          await knex('Target')
            .where({ geographyId: geography.id })
            .where({ targetToken: key })
            .update({ targetValue: value })
        })
      )
    })
  )
}
