const _ = require('lodash')
const Boom = require('boom')

async function getOrCreateSite(
  knex,
  device,
  payload,
  now,
  countryCode,
  deviceName,
  fromGxAlert
) {
  let sites = []
  if (!countryCode) {
    countryCode = _.get(payload, 'configuration.data.country')
    if (!countryCode) {
      if (!countryCode && device) {
        ;[countryCode] = await knex('Device as d')
          .leftJoin('Site as s', 's.id', 'd.siteId')
          .innerJoin('Geography as g', function() {
            this.on('d.geographyId', 'g.id').orOn('s.geographyId', 'g.id')
          })
          .innerJoin('Country as c', 'g.countryId', 'c.id')
          .where('d.id', device.id)
          .pluck('c.abbreviation')
      }
    }
  }
  if (!deviceName) {
    deviceName = _.get(payload, 'name')
  }
  if (deviceName && countryCode) {
    if (device.siteId && !fromGxAlert) {
      sites = await knex
        .from('Site as s')
        .where('s.id', device.siteId)
        .select()
    }
    const payloadSiteId = _.get(payload, 'site.id')
    if (_.isEmpty(sites) && payloadSiteId) {
      sites = await knex
        .from('Site as s')
        .where({
          's.externalId': payloadSiteId,
          's.partnerId': device.partnerId,
        })
        .select()
    }
    if (_.isEmpty(sites) && device.id && !fromGxAlert) {
      sites = await knex
        .from('Device as d')
        .join('Site as s', 'd.siteId', 's.id')
        .where({ 'd.id': device.id })
        .select('s.*')
    }
    if (_.isEmpty(sites)) {
      const matchingSites = await knex
        .from('Site as s')
        .join('Geography as g', 's.geographyId', 'g.id')
        .join('Country as c', 'g.countryId', 'c.id')
        .where({
          's.partnerId': device.partnerId,
          'c.abbreviation': countryCode,
        })
        .andWhere(function() {
          this.where({ 's.name': deviceName })
            .orWhere({ 's.shortName': deviceName })
            .orWhere({ 's.externalId': deviceName })
        })
        .select('s.*')
      if (matchingSites.length === 1) {
        sites = matchingSites.splice(0, 1)
      } else if (matchingSites.length > 1) {
        throw Boom.conflict(
          `Cannot uniquely determine which site this request came from using ${deviceName} in ${countryCode})`
        )
      }
      if (_.isEmpty(sites)) {
        // If we cannot determine the site by name, external ID or device
        // create a new site
        const [{ countryId }] = await knex
          .from('Country as c')
          .where({ abbreviation: countryCode })
          .select('c.id as countryId')
        if (!countryId) {
          throw Boom.notFound(
            `Cannot determine the country from ${countryCode}.`
          )
        }
        const [geography] = await knex
          .from('Geography as g')
          .where({ 'g.countryId': countryId })
          .whereNull('g.stateId')
          .whereNull('g.lgaId')
          .select('g.id')
        if (_.isEmpty(geography)) {
          const [geographyId] = await knex('Geography').insert({ countryId })
          geography.id = geographyId
        }

        const newSite = {
          name: deviceName,
          shortName: deviceName,
          externalId: deviceName,
          partnerId: device.partnerId,
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
        const [newSiteId] = await knex.insert(newSite).into('Site')
        sites = await knex
          .from('Site as s')
          .where('s.id', newSiteId)
          .select()
      }
    }
  } else {
    throw Boom.notFound('Cannot determine which site this request came from')
  }
  return _.head(sites)
}

module.exports = { getOrCreateSite }
