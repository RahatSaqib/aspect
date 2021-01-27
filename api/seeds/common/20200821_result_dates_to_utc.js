const setupPaginator = require('../../src/shared/knex-paginator')

const MAX_ROWS_PER_UPDATE = 1000
const MAX_ROWS_PER_BATCH = 10001
async function seed(knex) {
  setupPaginator(knex)
  const [{ mySqlTimezoneTablesMissing }] = await knex.select(
    knex.raw(
      "ISNULL(CONVERT_TZ(now(), 'EST', 'UTC')) as mySqlTimezoneTablesMissing"
    )
  )
  if (mySqlTimezoneTablesMissing === 1)
    throw new Error(
      "TimeZone tables weren't configured on the MySql server. For more information, check the next link: https://dev.mysql.com/downloads/timezones.html."
    )

  const { minId: minResultId = 0, maxId: maxResultId = 0 } = await knex(
    'Result'
  )
    .max('id as maxId')
    .min('id as minId')
    .first()
  const { minId: minSampleId = 0, maxId: maxSampleId = 0 } = await knex(
    'Sample'
  )
    .max('id as maxId')
    .min('id as minId')
    .first()

  let currentMinValue = minResultId
  let updateQueries = []
  while (
    currentMinValue < maxResultId &&
    currentMinValue % (minResultId + MAX_ROWS_PER_BATCH) !== 0
  ) {
    updateQueries.push(
      getResultDateUpdates(
        knex,
        currentMinValue,
        currentMinValue + MAX_ROWS_PER_UPDATE
      )
    )
    currentMinValue += MAX_ROWS_PER_UPDATE
  }

  if (updateQueries.length !== 0) await Promise.all(updateQueries)

  currentMinValue = minSampleId
  updateQueries = []
  while (
    currentMinValue < maxSampleId &&
    currentMinValue % (minSampleId + MAX_ROWS_PER_BATCH) !== 0
  ) {
    updateQueries.push(
      getSampleDateUpdates(
        knex,
        currentMinValue,
        currentMinValue + MAX_ROWS_PER_UPDATE
      )
    )
    currentMinValue += MAX_ROWS_PER_UPDATE
  }
  if (updateQueries.length !== 0) await Promise.all(updateQueries)
}

async function getResultDateUpdates(knex, minValue, maxValue) {
  return knex('Result as r')
    .innerJoin('Site as s', 'r.siteId', 's.id')
    .leftJoin('Geography as g', 's.geographyId', 'g.id')
    .innerJoin('Country as c', 'g.countryId', 'c.id')
    .innerJoin('TimeZone as countrytz', 'c.timezone', 'countrytz.id')
    .leftJoin('TimeZone as sitetz', 's.timezoneId', 'sitetz.id')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .leftJoin('TimeZone as devicetz', 'd.timezone', 'devicetz.id')
    .update({
      'r.endedOn': knex.raw(`IFNULL(CONVERT_TZ(r.endedOn,
            COALESCE(devicetz.timezone,
                    sitetz.timezone,
                    countrytz.timezone),
            'UTC'), r.endedOn)`),
      'r.startedOn': knex.raw(`IFNULL(CONVERT_TZ(r.startedOn,
            COALESCE(devicetz.timezone,
                    sitetz.timezone,
                    countrytz.timezone),
            'UTC'), r.startedOn)`),
    })
    .where('r.id', '>', minValue)
    .andWhere('r.id', '<=', maxValue)
}

async function getSampleDateUpdates(knex, minValue, maxValue) {
  return knex('Sample as sm')
    .innerJoin('Result as r', 'sm.id', 'r.sampleId')
    .innerJoin('Site as s', 'sm.originSiteId', 's.id')
    .leftJoin('Geography as g', 's.geographyId', 'g.id')
    .innerJoin('Country as c', 'g.countryId', 'c.id')
    .innerJoin('TimeZone as countrytz', 'c.timezone', 'countrytz.id')
    .leftJoin('TimeZone as sitetz', 's.timezoneId', 'sitetz.id')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .leftJoin('TimeZone as devicetz', 'd.timezone', 'devicetz.id')
    .update({
      'sm.collectedOn': knex.raw(`IFNULL(CONVERT_TZ(sm.collectedOn,
            COALESCE(devicetz.timezone,
                    sitetz.timezone,
                    countrytz.timezone),
            'UTC'), sm.collectedOn)`),
    })
    .where('sm.id', '>', minValue)
    .andWhere('sm.id', '<=', maxValue)
}

module.exports = seed
