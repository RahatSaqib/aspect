module.exports = require('../utils').seed(seed, __filename)

const _ = require('lodash')
const devices = require('./fixtures/SimCardsGxAlert.json')

const DEVICE_TYPE_EXTERNAL_ID = 'GSMRouter'
const DEVICE_TYPE_NAME = 'GSM Router'
const DEVICE_TYPE_MANUFACTURER = 'Unknown'

async function seed(knex) {
  const deviceTypeId = await getDeviceTypeId(knex)
  const partnerId = await getPartnerId(knex)
  const defaultSiteId = await getDefaultSiteId(knex)
  const deviceApprovalId = await getDeviceApprovalId(knex)
  const adminUserId = await getAdminUserId(knex)
  await Promise.all(
    _.map(devices, async device => {
      const geographyId = await getGeographyId(
        knex,
        device.zone,
        device.district
      )
      let siteId = defaultSiteId
      if (device.deploymentName && geographyId) {
        const site4Save = {
          name: device.deploymentName,
          street1: device.street,
          street2: device.street2,
          city: device.city,
          longitude: device.longitude,
          latitude: device.latitude,
          geographyId,
        }
        const [addedSiteId] = await knex('Site').insert(site4Save)
        siteId = addedSiteId
      }

      const device4save = {
        name: `${device.deploymentName} - ${device.router}`,
        shortName: device.deploymentName,
        deviceTypeId,
        deviceApprovalId,
        partnerId,
        geographyId,
        siteId,
      }
      const [deviceId] = await knex('Device').insert(device4save)

      const now = new Date()
      const sim4save = {
        deviceId,
        serial: device.router,
        number: device.sim1Number,
        createdBy: adminUserId,
        createdOn: now,
        updatedBy: adminUserId,
        updatedOn: now,
      }
      await knex('DeviceSim').insert(sim4save)
    })
  )
}

const getDeviceTypeId = async knex => {
  const { id: deviceTypeCategoryId } = await knex('DeviceTypeCategory')
    .where('name', 'Router')
    .first('id')
  const { id: deviceTypeId } =
    (await knex('DeviceType')
      .where('deviceTypeCategoryId', deviceTypeCategoryId)
      .first('id')) || {}
  if (!deviceTypeId) {
    const [addedDeviceTypeId] = await knex('DeviceType').insert({
      externalId: DEVICE_TYPE_EXTERNAL_ID,
      name: DEVICE_TYPE_NAME,
      manufacturer: DEVICE_TYPE_MANUFACTURER,
      deviceTypeCategoryId,
    })
    return addedDeviceTypeId
  }
  return deviceTypeId
}

const getGeographyId = async (knex, state, lga) => {
  const { id: stateId } =
    (await knex('State').where('name', state).first('id')) || {}
  const { id: lgaId } = (await knex('Lga').where('name', lga).first('id')) || {}
  if (!stateId || !lgaId) {
    return
  }
  const { id: geographyId } = await knex('Geography')
    .where('stateId', stateId)
    .andWhere('lgaId', lgaId)
    .first('id')
  return geographyId
}

const getPartnerId = async knex => {
  const { id: partnerId } = await knex('Partner')
    .where('name', 'Malawi')
    .first('id')
  return partnerId
}

const getDefaultSiteId = async knex => {
  const { id: siteId } = await knex('Site').where('name', 'Aspect').first('id')
  return siteId
}

const getDeviceApprovalId = async knex => {
  const { id: deviceApprovalId } = await knex('DeviceApproval')
    .where('name', 'Approved')
    .first('id')
  return deviceApprovalId
}

const getAdminUserId = async knex => {
  const { id: userId } = await knex('User').where('name', 'Admin').first('id')
  return userId
}
