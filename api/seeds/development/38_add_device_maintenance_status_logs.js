module.exports = require('../utils').seed(seed, __filename)

const Promise = require('bluebird')
const {
  addDays,
  format,
  isWeekend,
  subMonths,
  endOfMonth,
  parseISO,
} = require('date-fns')

const {
  allDeviceMaintenanceStatusToId,
} = require('../../src/shared/dictionary')

async function seed(knex) {
  const now = new Date()
  const previousMonth = subMonths(now, 1)
  const minDate = parseISO(
    `${format(previousMonth, 'yyyy-MM-01')}T00:00:00.000Z`
  )
  const maxDate = endOfMonth(previousMonth)

  const { partnerId } = await knex('Person as p')
    .innerJoin('User as u')
    .where('u.name', 'admin')
    .first('p.lastPartnerId as partnerId', 'p.id as personId', 'p.userId')
  const countryAbbreviation = 'US'
  const deviceMaintenanceStatusToId = await allDeviceMaintenanceStatusToId()
  const incactiveStatusIds = [
    deviceMaintenanceStatusToId.inactiveUnknown,
    deviceMaintenanceStatusToId.inactiveNoResultsReported,
    deviceMaintenanceStatusToId.inactiveOutOfInventory,
    deviceMaintenanceStatusToId.inactiveDownForRepair,
    deviceMaintenanceStatusToId.inactiveConnectivity,
    deviceMaintenanceStatusToId.inactiveDecommissioned,
  ]

  const deviceIds = await knex('Device as d')
    .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .join('DeviceTypeCategory as dtc', 'dt.deviceTypeCategoryId', 'dtc.id')
    .join('Site as s', 'd.siteId', 's.id')
    .join('Geography as g', 's.geographyId', 'g.id')
    .join('Country as c', 'g.countryId', 'c.id')
    .where('dt.externalId', 'CepheidGeneXpert')
    .whereIn('dtc.name', ['Lab', 'Integrated', 'Information System'])
    .where('d.partnerId', partnerId)
    .where('s.partnerId', partnerId)
    .where('c.abbreviation', countryAbbreviation)
    .pluck('d.id')

  const deviceId = deviceIds[0]

  const activeDates = (
    await knex('Result as r')
      .join('Device as d', 'r.deviceId', 'd.id')
      .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
      .join('DeviceTypeCategory as dtc', 'dt.deviceTypeCategoryId', 'dtc.id')
      .leftOuterJoin('Site as s', 'd.siteId', 's.id')
      .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
      // only for Cepheid GX
      .where('dt.externalId', 'CepheidGeneXpert')
      .whereRaw('r.endedOn >= ? AND r.endedOn <= ?', [minDate, maxDate])
      .select(
        knex.raw(`DISTINCT DATE_FORMAT(r.endedOn, '%Y-%m-%d') AS dayDate`)
      )
  ).map(d => parseISO(`${d.dayDate}T00:00:00.000Z`))

  // week-day dates without results
  const weekDays = []
  for (let day = minDate; day < maxDate; day = addDays(day, 1)) {
    if (
      !isWeekend(day) &&
      !activeDates.find(
        dayDate => format(dayDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
      )
    ) {
      weekDays.push(day)
    }
  }

  // -----------------------------
  // insert DeviceMaintenanceStatusLog's
  // -----------------------------
  // helper func
  const addDmsl = async (date, deviceMaintenanceStatusId) =>
    knex('DeviceMaintenanceStatusLog').insert({
      deviceId,
      deviceMaintenanceStatusId,
      data: '{}',
      day: format(date, 'yyyy-MM-dd'),
      createdOn: date,
    })

  // Active status for all days with results
  await Promise.each(activeDates, date =>
    addDmsl(date, deviceMaintenanceStatusToId.active)
  )

  // Inactive statuses for all days without results
  await Promise.each(weekDays, (day, index) => {
    addDmsl(day, incactiveStatusIds[index % incactiveStatusIds.length])
  })
}
