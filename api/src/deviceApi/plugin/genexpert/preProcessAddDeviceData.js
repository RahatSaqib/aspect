const _ = require('lodash')
const Boom = require('boom')
const { getOrCreateSite } = require('./site')
/*
The purpose of this plugin is to ensure that results are captured
even when the site is unknown to Aspect
If the device is unknown, ignore this request
If the site for the device in unknown, create a site and link it to the device
*/
async function preProcessAddDeviceData({ knex, device, payload, now }) {
  if (_.isEmpty(device)) {
    throw Boom.notFound(`Cannot find device ${JSON.stringify(device)}`)
  }
  const configurationData = _.get(payload, 'configuration.data') || {}
  const site = await getOrCreateSite(knex, device, payload, now)
  const deviceDetails = {
    lastSeenOn: new Date(configurationData.lastPingOn || now),
    updatedOn: now,
    updatedBy: null,
  }
  if (device.siteId !== site.id) {
    deviceDetails.siteId = site.id
  }
  if (device.geographyId !== site.geographyId) {
    deviceDetails.geographyId = site.geographyId
  }
  // A ping from GxConnect is just a configuration POST with a MAC address,
  // host ID, device Serial and country abbreviation
  // A ping from GxConnect forwarded by GxAlert is the same as a ping cooming
  // directly from GxConnect but also includes gxAlertDeviceId
  if (
    !_.isEmpty(configurationData) &&
    _.every(Object.keys(configurationData), configurationDataKey =>
      [
        'macAddress',
        'gxAlertDeviceId',
        'hostId',
        'deviceSerialNumber',
        'country',
        'lastPingOn',
      ].includes(configurationDataKey)
    )
  ) {
    deviceDetails.lastPingOn = new Date(configurationData.lastPingOn || now)
  }
  await knex
    .from('Device')
    .where({ id: device.id })
    .update(deviceDetails)
}

module.exports = preProcessAddDeviceData
