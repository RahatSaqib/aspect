async function seed(knex) {
  const resultDateUpdates = await getResultDateUpdates(knex)
  await Promise.all(resultDateUpdates)
  const sampleDateUpdates = await getSampleDateUpdates(knex)
  await Promise.all(sampleDateUpdates)
}

async function getResultDateUpdates(knex) {
  const dates = await knex('Result as r')
    .innerJoin('Site as s', 'r.siteId', 's.id')
    .leftJoin('Geography as g', 's.geographyId', 'g.id')
    .innerJoin('Country as c', 'g.countryId', 'c.id')
    .innerJoin('TimeZone as countrytz', 'c.timezone', 'countrytz.id')
    .leftJoin('TimeZone as sitetz', 's.timezoneId', 'sitetz.id')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .leftJoin('TimeZone as devicetz', 'd.timezone', 'devicetz.id')
    .select([
      'r.id',
      knex.raw(`CONVERT_TZ(r.endedOn,
            COALESCE(devicetz.timezone,
                    sitetz.timezone,
                    countrytz.timezone),
            'UTC') as endedOn`),
      knex.raw(`IFNULL(CONVERT_TZ(r.startedOn,
            COALESCE(devicetz.timezone,
                    sitetz.timezone,
                    countrytz.timezone),
            'UTC'), r.startedOn) as startedOn
        `),
    ])
  return dates.map(({ id, ...dates }) =>
    knex('Result').where({ id }).update(dates)
  )
}

async function getSampleDateUpdates(knex) {
  const dates = await knex('Sample as sm')
    .innerJoin('Result as r', 'sm.id', 'r.sampleId')
    .innerJoin('Site as s', 'sm.originSiteId', 's.id')
    .leftJoin('Geography as g', 's.geographyId', 'g.id')
    .innerJoin('Country as c', 'g.countryId', 'c.id')
    .innerJoin('TimeZone as countrytz', 'c.timezone', 'countrytz.id')
    .leftJoin('TimeZone as sitetz', 's.timezoneId', 'sitetz.id')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .leftJoin('TimeZone as devicetz', 'd.timezone', 'devicetz.id')
    .select([
      'sm.id',
      knex.raw(`IFNULL(CONVERT_TZ(sm.collectedOn,
            COALESCE(devicetz.timezone,
                    sitetz.timezone,
                    countrytz.timezone),
            'UTC'), sm.collectedOn) as collectedOn`),
    ])
  return dates.map(({ id, ...dates }) =>
    knex('Sample').where({ id }).update(dates)
  )
}

module.exports = seed
