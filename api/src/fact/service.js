const { subDays } = require('date-fns')
const { knex } = require('../db')

function* calculateResultCounts() {
  const now = new Date()

  const daysToCalculate = [1, 7, 30, 60, 90, 365, null]

  const resultCountQuery = knex('Device as d')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .innerJoin('DeviceTypeCategory as dtc', 'dt.deviceTypeCategoryId', 'dtc.id')
    .where('dtc.hasResults', 1)

  for (const days of daysToCalculate) {
    // empty facts table for that day so we don't have dupes:
    yield knex('FactResultCountDevice').where({ days }).delete()

    // calculate by device
    yield knex
      .from('FactResultCountDevice')
      .insert(
        resultCountQuery
          .clone()
          .joinRaw(
            `left outer join Result as r on r.deviceId = d.id and (r.endedOn > ? or r.id is null)`,
            [subDays(now, days || 9999)]
          )
          .groupBy('d.id')
          .select(
            knex.raw(
              `d.id, null as AssayId, null as resultCategory1, ? as days, count(r.id) as resultCount, ? as calculatedOn`,
              [days, now]
            )
          )
      )

    // ... grouped by assay. only calculate for assays that device type is actually capable of processing
    yield knex
      .from('FactResultCountDevice')
      .insert(
        resultCountQuery
          .clone()
          .join('Assay as a', 'a.deviceTypeId', 'dt.id')
          .joinRaw(
            `left outer join Result as r on r.deviceId = d.id and r.assayId = a.id and (r.endedOn > ? or r.id is null)`,
            [subDays(now, days || 9999)]
          )
          .groupBy('d.id', 'a.id')
          .select(
            knex.raw(
              `d.id, a.id, null as resultCategory1, ? as days, count(r.id) as resultCount, ? as calculatedOn`,
              [days, now]
            )
          )
      )

    // ...grouped by assay, resultCategory
    yield knex
      .from('FactResultCountDevice')
      .insert(
        resultCountQuery
          .clone()
          .join('Assay as a', 'a.deviceTypeId', 'dt.id')
          .join('ResultCategoryAssay as rca', 'rca.assayId', 'a.id')
          .joinRaw(
            `left outer join Result as r on r.deviceId = d.id and r.assayId = a.id and r.resultCategory1 = rca.resultCategoryId and (r.endedOn > ? or r.id is null)`,
            [subDays(now, days || 9999)]
          )
          .groupBy('d.id', 'a.id', 'rca.resultCategoryid')
          .select(
            knex.raw(
              `d.id, a.id, rca.resultCategoryId as resultCategory1, ? as days, count(r.id) as resultCount, ? as calculatedOn`,
              [days, now]
            )
          )
      )
  }
}

module.exports = {
  calculateResultCounts,
}
