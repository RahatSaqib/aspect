/* eslint no-await-in-loop: 0 */
module.exports = require('../utils').seed(seed, __filename)

const _ = require('lodash')
const Promise = require('bluebird')
const { subMinutes, subMonths } = require('date-fns')

const { randomToken } = require('../../src/deviceApi/apiKey')
const labClinic = require('./fixtures/labClinic.json')
const {
  deviceTypeToId,
  deviceStatusToId,
} = require('../../src/shared/dictionary')

const now = new Date()

async function seed(knex) {
  const { id: adminId } = await knex('User')
    .where({ name: 'admin' })
    .first('id')
  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }
  const { id: partnerId } = await knex('Partner')
    .where('name', 'Cameroon')
    .first('id')

  const [cameroonCountry] = await knex('Country')
    .where('a3', 'CMR')
    .select('id', 'culture', 'timezone')

  const { id: cameroonGeographyId } = await knex('Geography')
    .whereNull('stateId')
    .andWhere('countryId', cameroonCountry.id)
    .first()

  const cameroonStates = await knex('Geography as g')
    .innerJoin('State as s', 's.id', 'g.stateId')
    .where({ 'g.countryId': cameroonCountry.id })
    .select('g.countryId', 's.id', 's.name')

  const statesByName = cameroonStates.reduce((memo, state) => {
    memo[state.name.toLowerCase()] = state
    return memo
  }, {})

  const approvedDeviceStatusId = await deviceStatusToId('approved')

  await Promise.all(
    _.map(labClinic.clinics, async clinic => {
      const { id: clinicGeographyId } = await knex('Geography')
        .where({
          countryId: cameroonCountry.id,
          stateId: (
            statesByName[clinic.stateName.toLowerCase()] || { id: null }
          ).id,
        })
        .first()

      // sites
      const siteData = Object.assign(
        {
          partnerId,
          geographyId: clinicGeographyId,
          name: clinic.name,
          shortName: clinic.shortName,
          externalId: clinic.externalId,
          latitude: clinic.latitude,
          longitude: clinic.longitude,
        },
        auditFields
      )
      await knex('Site').insert(siteData)
    })
  )

  await Promise.all(
    _.map(labClinic.labs, async lab => {
      // every lab has a site, m2000 device and a user assigned to it
      const siteData = Object.assign(
        {
          partnerId,
          geographyId: cameroonGeographyId,
          name: lab.name,
          shortName: lab.shortName,
          externalId: lab.externalId,
          latitude: lab.latitude,
          longitude: lab.longitude,
        },
        auditFields
      )
      const [siteId] = await knex('Site').insert(siteData)
      siteData.id = siteId

      if (lab.devices) {
        await Promise.all(
          _.map(lab.devices, async device => {
            const deviceApiKeyToken = device.deviceApiKey || randomToken()
            const deviceData =
              (await knex('DeviceApiKey as dak')
                .join('Device as d', 'dak.deviceId', 'd.id')
                .where('dak.token', deviceApiKeyToken)
                .first('d.*')) || {}
            if (_.isEmpty(deviceData)) {
              const lastDeviceActivity = subMinutes(now, _.random(0, 60))
              deviceData.partnerId = partnerId
              deviceData.geographyId = siteData.geographyId
              deviceData.siteId = siteData.id
              deviceData.deviceTypeId = await deviceTypeToId(
                device.deviceTypeId
              )
              deviceData.deviceStatusId = approvedDeviceStatusId
              deviceData.name = device.name
              deviceData.shortName = device.shortName
              deviceData.macAddress = device.macAddress
              deviceData.serial = device.deviceSerial
              deviceData.hostId = device.hostId
              deviceData.lastSeenOn = lastDeviceActivity
              deviceData.lastPingOn = lastDeviceActivity
              deviceData.lastPingFromIp = device.lastPingFromIp
              deviceData.putInService = subMonths(now, 30)
              deviceData.putInServiceSource = 'Installed at lab'
              deviceData.configurationData = '{}'
              const [deviceId] = await knex('Device').insert({
                ...deviceData,
                ...auditFields,
              })
              deviceData.id = deviceId
              await knex('DeviceApiKey').insert({
                token: deviceApiKeyToken,
                revoked: 0,
                partnerId,
                geographyId: cameroonGeographyId,
                siteId,
                deviceId,
                ...auditFields,
              })
            }
          })
        )
      }
    })
  )
}
