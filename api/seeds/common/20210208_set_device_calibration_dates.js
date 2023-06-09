const Promise = require('bluebird')
const { subYears, subDays } = require('date-fns')
const { random } = require('lodash')

const { getPartnerByExternalId } = require('../utils')
const { allDeviceMaintenanceTypeToId } = require('../../src/shared/dictionary')

module.exports = async (knex, partnerExternalId, adminUserName, countryAbbreviation) => {
  const now = new Date()
  const { id: adminId } = await knex('User').where({ name: adminUserName }).first('id')
  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }
  const { id: partnerId } = await getPartnerByExternalId(knex, partnerExternalId)
  const deviceMaintenanceTypeToId = await allDeviceMaintenanceTypeToId()
  const deviceMaintenanceTypeId = deviceMaintenanceTypeToId.calibration

  const deviceIds = await knex('Device as d')
    .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .join('Site as s', 'd.siteId', 's.id')
    .join('Geography as g', 's.geographyId', 'g.id')
    .join('Country as c', 'g.countryId', 'c.id')
    .where('dt.externalId', 'CepheidGeneXpert')
    .where('d.partnerId', partnerId)
    .where('c.abbreviation', countryAbbreviation)
    .pluck('d.id')

  /**
   * helper func
   */
  const addCalibration = async (deviceId, contextDate, current) => {
    // create new calibration
    await knex('DeviceMaintenance').insert({
      deviceId,
      contextDate,
      deviceMaintenanceTypeId,
      notes: 'Seeding calibration entries',
      current,
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
      // rest of devices have a valid, recent calibration date
      contextDate = subDays(now, random(1, 60))
    }

    // create current record
    await addCalibration(deviceId, contextDate, true)

    // for most of the devices, also create an older record
    if (index > 2 && index % 5 !== 0) {
      await addCalibration(deviceId, subDays(contextDate, random(180, 540)), false)
    }
  })
}
