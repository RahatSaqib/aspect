const _ = require('lodash')
const Boom = require('boom')
/*
The purpose of this plugin is to ensure that results are captured
even when the site is unknown to Aspect
If the device is unknown, ignore this request
If the site for the device in unknown, create a site and link it to the device
*/
function* preProcessAddDeviceData({ knex, device, payload, now }) {
  if (_.isEmpty(device)) {
    throw Boom.notFound(`Cannot find device ${JSON.stringify(device)}`)
  }
  const macAddress = _.get(payload, 'data.macAddress')
  if (!macAddressValid(macAddress)) {
    throw Boom.badRequest(`Invalid MAC address in request: '${macAddress}'`)
  }
  const site = yield* getOrCreateSite(knex, device, payload, now)
  if (device.siteId !== site.id) {
    yield knex
      .from('Device')
      .where({ id: device.id })
      .update({ siteId: site.id, updatedOn: now, updatedBy: null })
  }
  // TODO: Update device API key with new site ID
}

function* getOrCreateSite(knex, device, payload, now) {
  const site = {}
  if (device.siteId) {
    site.id = device.siteId
  }
  if (!site.id) {
    const payloadSiteId = _.get(payload, 'site.id')
    if (payloadSiteId) {
      const [{ id }] = yield knex
        .from('Site as s')
        .where({ 's.externalId': payloadSiteId })
        .select('s.id')
      site.id = id
    }
  }
  if (!site.id && device.id) {
    const [{ siteId }] = yield knex
      .from('Device as d')
      .where({ 'd.id': device.id })
      .select('d.siteId')
    site.id = siteId
  }
  if (!site.id) {
    const facilityName = _.get(payload, 'name')
    const countryCode = _.get(payload, 'configuration.data.country')
    if (facilityName && countryCode) {
      const siteIds = yield knex
        .from('Site as s')
        .join('Geography as g', 's.geographyId', 'g.id')
        .join('Country as c', 'g.countryId', 'c.id')
        .where({ 'c.abbreviation': countryCode })
        .andWhere(function() {
          this.where({ 's.name': facilityName })
            .orWhere({ 's.shortName': facilityName })
            .orWhere({ 's.externalId': facilityName })
        })
        .select('s.id')
      if (siteIds.length === 1) {
        site.id = siteIds[0].id
      } else if (siteIds.length > 1) {
        throw Boom.conflict(
          `Cannot uniquely determine which site this request came from using ${facilityName} in ${countryCode})`
        )
      }
      if (!site.id) {
        const [{ countryId }] = yield knex
          .from('Country as c')
          .where({ abbreviation: countryCode })
          .select('c.id as countryId')
        if (!countryId) {
          throw Boom.notFound(
            `Cannot determine the country from ${countryCode}.`
          )
        }
        const [geography] = yield knex
          .from('Geography as g')
          .where({ 'g.countryId': countryId })
          .whereNull('g.stateId')
          .whereNull('g.lgaId')
          .select('g.id')
        if (_.isEmpty(geography)) {
          const [id] = yield knex('Geography').insert({ countryId })
          geography.id = id
        }

        const newSite = {
          name: facilityName,
          shortName: facilityName,
          externalId: facilityName,
          geographyId: geography.id,
          createdOn: now,
          updatedOn: now,
        }
        if (newSite.name.length > 255) {
          newSite.name = newSite.name.substr(0, 255)
        }
        if (newSite.shortName.length > 45) {
          newSite.shortName = newSite.shortName.substr(0, 45)
        }
        if (newSite.externalId.length > 255) {
          newSite.externalId = newSite.externalId.substr(0, 255)
        }
        const [id] = yield knex.insert(newSite).into('Site')
        site.id = id
      }
    } else {
      throw Boom.notFound('Cannot determine which site this request came from')
    }
  }
  return site
}

function macAddressValid(macAddress) {
  return
  !_.isEmpty(macAddress) &&
    macAddress.indexOf('MAC') === 0 &&
    macAddress.trim().length > 3 &&
    macAddress !== 'MAC005345000000'
}

module.exports = preProcessAddDeviceData
