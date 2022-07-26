module.exports = require('../utils').seed(seed, __filename)

const { addDays, addSeconds, subMonths, startOfMonth } = require('date-fns')
const _ = require('lodash')
const Promise = require('bluebird')
const { startOfTodayUtc } = require('../../src/shared/date')

async function seed(knex) {
  const days = []
  let day = startOfMonth(subMonths(new Date(), 2))
  while (day < startOfTodayUtc()) {
    days.push(day)
    day = addDays(day, 1)
  }
  const devices = await knex('DeviceTypeCategory as dtc')
    .join('DeviceType as dt', 'dtc.id', 'dt.deviceTypeCategoryId')
    .join('Device as d', 'dt.id', 'd.deviceTypeId')
    .where('dtc.hasResults', true)
    .select('d.id', 'd.shortName', 'd.putInService')
  const deviceMaintenanceStatuses = await knex('DeviceMaintenanceStatus').select()
  const otherInactiveStatuses = deviceMaintenanceStatuses.filter(
    deviceMaintenanceStatus =>
      !deviceMaintenanceStatus.active &&
      deviceMaintenanceStatus.manuallySet &&
      deviceMaintenanceStatus.externalId !== 'inactiveUnknown'
  )
  await Promise.each(days, async day => {
    await Promise.each(devices, async device => {
      if (!device.putInService || device.putInService >= day) {
        const deviceMaintenanceStatus = deviceMaintenanceStatuses[_.random(0, deviceMaintenanceStatuses.length + 3)]
        if (deviceMaintenanceStatus) {
          const data = {}
          if (device.id % 3 === 0 && device.shortName && deviceMaintenanceStatus.manuallySet) {
            data.options = {
              data: {
                notes: `Some maintenance note for ${device.shortName}`,
              },
            }
          }
          await knex('DeviceMaintenanceStatusLog').insert({
            deviceId: device.id,
            deviceMaintenanceStatusId: deviceMaintenanceStatus.id,
            data: JSON.stringify(data),
            day,
            createdOn: addSeconds(day, _.random(0, 60 * 60 * 24)),
          })
          if (deviceMaintenanceStatus.externalId === 'inactiveUnknown') {
            await knex('DeviceMaintenanceStatusLog').insert({
              deviceId: device.id,
              deviceMaintenanceStatusId: otherInactiveStatuses[_.random(0, otherInactiveStatuses.length - 1)].id,
              data: JSON.stringify(data),
              day,
              createdOn: addSeconds(day, _.random(60 * 60 * 24 + 1, 60 * 60 * 24 * 5)),
            })
          }
        } else {
          await knex('DeviceMaintenanceStatusLog').insert({
            deviceId: device.id,
            deviceMaintenanceStatusId: deviceMaintenanceStatuses[_.random(0, deviceMaintenanceStatuses.length - 1)].id,
            data: JSON.stringify({}),
            day,
            createdOn: addSeconds(day, _.random(60 * 60 * 24 + 1, 60 * 60 * 24 * 5)),
          })
        }
      }
      return Promise.resolve()
    })
  })

  await Promise.each(devices, async device => {
    const latestDeviceMaintenanceStatusLog =
      (await knex('DeviceMaintenanceStatusLog as dmsl')
        .where('dmsl.deviceId', device.id)
        .orderByRaw('dmsl.day desc, dmsl.createdOn desc, dmsl.id desc')
        .first('dmsl.id')) || {}
    if (latestDeviceMaintenanceStatusLog) {
      await knex('Device').where('id', device.id).update({
        deviceMaintenanceStatusLogId: latestDeviceMaintenanceStatusLog.id,
      })
    }
  })
}
