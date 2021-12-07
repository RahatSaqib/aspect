module.exports = require('../utils').seed(seed, __filename)

const Promise = require('bluebird')
const devices = require('./fixtures/SimCardsGxAlert.json')

const DEVICE_TYPE_EXTERNAL_ID = 'GSMRouter'
const DEVICE_TYPE_NAME = 'GSM Router'
const DEVICE_TYPE_MANUFACTURER = 'Unknown'

async function seed(knex) {
  const deviceTypeId = await getDeviceTypeId(
    knex,
    DEVICE_TYPE_EXTERNAL_ID,
    DEVICE_TYPE_NAME,
    DEVICE_TYPE_MANUFACTURER
  )
  const partnerId = await getPartnerId(knex)
  const deviceApprovalId = await getDeviceApprovalId(knex)
  const adminUserId = await getAdminUserId(knex)

  await Promise.each(devices, async device => {
    const { siteId, geographyId } = getSiteAndGeography(
      knex,
      device.deploymentName,
      device.zone,
      device.district
    )

    const device4save = {
      name: device.deploymentName
        ? `${device.deploymentName} - ${device.router}`
        : device.router,
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
}

const getDeviceTypeId = async (knex, externalId, name, manufacturer) => {
  const { id: deviceTypeCategoryId } = await knex('DeviceTypeCategory')
    .where('name', 'Router')
    .first('id')

  const [deviceTypeId] = await knex('DeviceType').insert({
    externalId,
    name,
    manufacturer,
    deviceTypeCategoryId,
  })
  return deviceTypeId
}

const getSiteAndGeography = async (knex, name, state, lga) => {
  if (!state && !lga) {
    return { siteId: null, geographyId: null }
  }
  const row = await knex('Site').where('name', name).first()
  return { siteId: row.id, geographyId: row.geographyId }
}

const getPartnerId = async knex => {
  const { id: partnerId } = await knex('Partner')
    .where('name', 'Malawi')
    .first('id')
  return partnerId
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
