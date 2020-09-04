module.exports = require('../utils').seed(seed, __filename)

const Promise = require('bluebird')
const { addDays, format, isWeekend, subMonths, parseISO } = require('date-fns')

const {
  allDeviceMaintenanceStatusToId,
} = require('../../src/shared/dictionary')

async function seed(knex) {
  const now = new Date()
  const previousMonth = subMonths(now, 1)
  const minDate = parseISO(
    `${format(previousMonth, 'yyyy-MM-01')}T00:00:00.000Z`
  )
  const maxDate = now

  const { partnerId } = await knex('Person as p')
    .innerJoin('User as u')
    .where('u.name', 'admin')
    .first('p.lastPartnerId as partnerId', 'p.id as personId', 'p.userId')
  const countryAbbreviation = 'US'
  const deviceMaintenanceStatusToId = await allDeviceMaintenanceStatusToId()
  const inactiveStatusIds = [
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
    .where('c.abbreviation', countryAbbreviation)
    .pluck('d.id')

  const resultDevices = await knex('Result as r')
    .join('Device as d', 'r.deviceId', 'd.id')
    .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .join('DeviceTypeCategory as dtc', 'dt.deviceTypeCategoryId', 'dtc.id')
    .where('dt.externalId', 'CepheidGeneXpert')
    .where('r.endedOn', '>=', minDate)
    .where('r.endedOn', '<=', maxDate)
    .whereIn('r.deviceId', deviceIds)
    .select(
      'r.deviceId',
      knex.raw(`DATE_FORMAT(r.endedOn, '%Y-%m-%d') AS dayDate`)
    )
    .groupBy('r.deviceId', 'dayDate')

  // helper func
  const addDmsl = async (deviceId, date, deviceMaintenanceStatusId) => {
    const day = format(date, 'yyyy-MM-dd')
    // check if device has already been logged for this date
    const logItem = await knex('DeviceMaintenanceStatusLog')
      .where({ deviceId, day })
      .first()
    // if not - add entry
    if (!logItem) {
      await knex('DeviceMaintenanceStatusLog').insert({
        deviceId,
        deviceMaintenanceStatusId,
        data: '{}',
        day,
        createdOn: date,
      })
    }
  }

  // -----------------------------
  // insert into DeviceMaintenanceStatusLog's
  // -----------------------------
  await Promise.each(deviceIds, async deviceId => {
    // get all dates when current device had results
    const activeDates = resultDevices
      .filter(item => item.deviceId === deviceId)
      .map(({ dayDate }) => parseISO(`${dayDate}T00:00:00.000Z`))

    // fill weekDays with dates without results
    const weekDays = []
    for (let day = minDate; day < maxDate; day = addDays(day, 1)) {
      if (
        !activeDates.find(
          dayDate => format(dayDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
        )
      ) {
        weekDays.push(day)
      }
    }

    // Active status for all days with results
    await Promise.each(activeDates, date =>
      addDmsl(deviceId, date, deviceMaintenanceStatusToId.active)
    )

    // Inactive statuses for all days without results
    await Promise.each(weekDays, (day, index) => {
      const inactiveStatusId = isWeekend(day)
        ? deviceMaintenanceStatusToId.inactiveUnknown
        : inactiveStatusIds[index % inactiveStatusIds.length]
      addDmsl(deviceId, day, inactiveStatusId)
    })
  })
}
