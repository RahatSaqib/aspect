// const Promise = require('bluebird')

// const { upsertDashboardWidgets } = require('../common')

const Promise = require('bluebird')
const { addYears, subYears, subDays } = require('date-fns')
const { random } = require('lodash')

const { getPartnerByName } = require('../utils')
const { allDeviceMaintenanceTypeToId } = require('../../src/shared/dictionary')

module.exports = async (knex, partnerName, adminName, countryAbbreviation) => {
  const now = new Date()
  const { id: adminId } = await knex('User')
    .where({ name: adminName })
    .first('id')
  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }
  const { id: partnerId } = await getPartnerByName(knex, partnerName)
  const deviceMaintenanceTypeToId = await allDeviceMaintenanceTypeToId()
  const deviceMaintenanceTypeId = deviceMaintenanceTypeToId.calibration

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

  /**
   * helper func
   */
  const addCalibration = async (deviceId, contextDate) => {
    // return if device has valid calibration
    const item = await knex('DeviceMaintenance')
      .where({ deviceId, deviceMaintenanceTypeId, current: 1 })
      .first()
    if (item && addYears(item.contextDate) > now) {
      return
    }
    // otherwise - reset current calibration
    await knex('DeviceMaintenance')
      .where({ deviceId, deviceMaintenanceTypeId })
      .update({
        current: 0,
        updatedOn: new Date(),
        updatedBy: adminId,
      })
    // create new calibration
    await knex('DeviceMaintenance').insert({
      deviceId,
      contextDate,
      deviceMaintenanceTypeId,
      notes: 'Seeding calibration entries',
      current: 1,
      ...auditFields,
    })
  }

  // insert into DeviceMaintenance
  await Promise.each(deviceIds, async (deviceId, index) => {
    let contextDate = now
    if (index === 0) {
      // expired more than 1 year ago
      contextDate = subYears(now, 2.1)
    } else if (index === 1) {
      // just recently expired
      contextDate = subDays(now, 370)
    } else if (index === 2) {
      // soon is going to expire
      contextDate = subDays(now, 360)
    } else {
      // rest of devices have valid calibration date (calibrated less than 1 year ago)
      contextDate = subDays(now, random(1, 360))
    }
    await addCalibration(deviceId, contextDate)
  })
}
