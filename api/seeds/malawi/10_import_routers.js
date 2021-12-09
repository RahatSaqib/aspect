module.exports = require('../utils').seed(seed, __filename)

const Promise = require('bluebird')
const devices = require('./fixtures/SimCardsGxAlert.json')

const DEVICE_TYPE_EXTERNAL_ID = 'MetacomRouter'
const DEVICE_TYPE_NAME = 'Metacom Router'
const DEVICE_TYPE_MANUFACTURER = 'Metacom'

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
  const defaultGeographyId = await getDafaultGeographyId(knex)

  await Promise.each(devices, async device => {
    // temporary skip devices without Deployment Name (Site) provided!
    if (!device.deploymentName) {
      return
    }

    const { siteId, geographyId } = await getSiteAndGeography(
      knex,
      device,
      defaultGeographyId,
      partnerId
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

const getDafaultGeographyId = async knex => {
  const { id: geographyId } = await knex('Geography')
    .whereNotNull('countryId')
    .whereNull('stateId')
    .whereNull('lgaId')
    .first('id')
  return geographyId
}

const getSiteAndGeography = async (
  knex,
  device,
  defaultGeographyId,
  partnerId
) => {
  if (!device.zone && !device.district) {
    const site4Save = {
      name: device.deploymentName,
      shortName: device.deploymentName,
      externalId: device.deploymentName,
      street1: device.street,
      street2: device.street2,
      city: device.city,
      longitude: device.longitude,
      latitude: device.latitude,
      geographyId: defaultGeographyId,
      partnerId,
    }
    const [siteId] = await knex('Site').insert(site4Save)
    return { siteId, defaultGeographyId }
  }
  const row = await knex('Site').where('name', device.deploymentName).first()
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
