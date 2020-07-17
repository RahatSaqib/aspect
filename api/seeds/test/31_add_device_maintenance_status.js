module.exports = require('../utils').seed(seed, __filename)

const { startOfToday, addDays, addSeconds } = require('date-fns')
const _ = require('lodash')
const Promise = require('bluebird')

async function seed(knex) {
  const days = []
  let day = new Date(2018, 0, 1)
  while (day < startOfToday()) {
    days.push(day)
    day = addDays(day, 1)
  }
  const devices = await knex('DeviceTypeCategory as dtc')
    .join('DeviceType as dt', 'dtc.id', 'dt.deviceTypeCategoryId')
    .join('Device as d', 'dt.id', 'd.deviceTypeId')
    .where('dtc.hasResults', true)
    .select('d.id', 'd.putInService')
  const deviceMaintenanceStatuses = await knex(
    'DeviceMaintenanceStatus'
  ).select()
  const otherInactiveStatuses = deviceMaintenanceStatuses.filter(
    deviceMaintenanceStatus =>
      !deviceMaintenanceStatus.active &&
      deviceMaintenanceStatus.manuallySet &&
      deviceMaintenanceStatus.externalId !== 'inactiveUnknown'
  )
  await Promise.each(days, async day => {
    await Promise.each(devices, async device => {
      if (!device.putInService || device.putInService >= day) {
        const deviceMaintenanceStatus =
          deviceMaintenanceStatuses[
            _.random(0, deviceMaintenanceStatuses.length + 3)
          ]
        if (deviceMaintenanceStatus) {
          await knex('DeviceMaintenanceStatusLog').insert({
            deviceId: device.id,
            deviceMaintenanceStatusId: deviceMaintenanceStatus.id,
            data: JSON.stringify('{}'),
            day,
            createdOn: addSeconds(day, _.random(0, 60 * 60 * 24)),
          })
          if (deviceMaintenanceStatus.externalId === 'inactiveUnknown') {
            await knex('DeviceMaintenanceStatusLog').insert({
              deviceId: device.id,
              deviceMaintenanceStatusId:
                otherInactiveStatuses[
                  _.random(0, otherInactiveStatuses.length - 1)
                ].id,
              data: JSON.stringify('{}'),
              day,
              createdOn: addSeconds(
                day,
                _.random(60 * 60 * 24 + 1, 60 * 60 * 24 * 5)
              ),
            })
          }
        } else {
          await knex('DeviceMaintenanceStatusLog').insert({
            deviceId: device.id,
            deviceMaintenanceStatusId:
              deviceMaintenanceStatuses[
                _.random(0, deviceMaintenanceStatuses.length - 1)
              ].id,
            data: JSON.stringify('{}'),
            day,
            createdOn: addSeconds(
              day,
              _.random(60 * 60 * 24 + 1, 60 * 60 * 24 * 5)
            ),
          })
        }
      }
      return Promise.resolve()
    })
  })
}
