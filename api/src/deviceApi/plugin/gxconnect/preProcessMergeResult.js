const _ = require('lodash')
const Boom = require('boom')
const { query } = require('../../../db')
/*
The purpose of this plugin is to ensure that results are captured even when the
assay name in the result result or site are unknown to Aspect
If the device is unknown, ignore this request
If an unknown assay is detected, create it
If the site for the device in unknown, create a site and link it to the device
*/
function* preProcessMergeResult({ knex, deviceId, payload, now }) {
  if (!deviceId) {
    throw Boom.notFound('Cannot find device')
  }
  const device = yield query('Get device linked to API key', knex)
    .from('Device as d')
    .where({ 'd.id': deviceId })
    .select('d.id', 'd.siteId', 'd.deviceTypeId')
    .first()
  if (_.isEmpty(device)) {
    throw Boom.notFound(`Cannot find device ${deviceId}`)
  }
  yield* createAssayIfNotExists(knex, device, payload)
  const site = yield* getOrCreateSite(knex, device, payload, now)
  if (device.siteId !== site.id) {
    yield query('Save link device to site', knex)
      .from('Device')
      .where({ id: deviceId })
      .update({ siteId: site.id, updatedOn: now, updatedBy: null })
  }
}

function* createAssayIfNotExists(knex, device, payload) {
  const payloadAssayId = _.get(payload, 'result.assay.id', false)
  const assay = yield query('Get assay using external ID', knex)
    .from('Assay as a')
    .where({ 'a.externalId': payloadAssayId })
    .select('a.id')
    .first()
  if (_.isEmpty(assay)) {
    const unknownAssayType = yield query('Get unknown assay type', knex)
      .from('AssayType as at')
      .where({ 'at.name': 'Unknown' })
      .select('at.id')
      .first()
    if (!_.isEmpty(unknownAssayType)) {
      if (!device.deviceTypeId) {
        const deviceTypeExternalId = _.get(payload, 'type.id')
        const deviceType = yield query(
          'Get device type using external ID',
          knex
        )
          .from('DeviceType as dt')
          .where({ 'dt.externalid': deviceTypeExternalId })
          .select('dt.id')
          .first()
        device.deviceTypeId = deviceType.id
      }
      const resultSourceExternalId =
        _.get(payload, 'result.source.id') || 'DiagnosticDevice'
      const resultSource = yield query(
        'Get result source using external ID',
        knex
      )
        .from('ResultSource as rs')
        .where({ 'rs.externalid': resultSourceExternalId })
        .select('rs.id')
        .first()
      if (!_.isEmpty(resultSource)) {
        if (device.deviceTypeId) {
          yield query('Insert assay', knex)
            .insert({
              name: payloadAssayId,
              externalId: payloadAssayId,
              assayTypeId: unknownAssayType.id,
              deviceTypeId: device.deviceTypeId,
              resultSourceId: resultSource.id,
            })
            .into('Assay')
        } else {
          throw Boom.notFound(
            'Cannot find device type for this result, please ensure that the Device API key is linked to an actual device or type has been specified in this request'
          )
        }
      } else {
        throw Boom.notFound(
          'Cannot determine the type of result source for a new assay no diagnostic device result source exists.'
        )
      }
    } else {
      throw Boom.notFound(
        'Cannot determine the type of assay for this result and no unknown assay type exists.'
      )
    }
  }
}

function* getOrCreateSite(knex, device, payload, now) {
  const site = {}
  if (device.siteId) {
    site.id = device.siteId
  }
  if (!site.id) {
    const payloadSiteId = _.get(payload, 'site.id')
    if (payloadSiteId) {
      const [id] = yield query('Get site using external ID', knex)
        .from('Site as s')
        .where({ 's.externalId': payloadSiteId })
        .select('s.id')
        .first()
      site.id = id
    }
  }
  if (!site.id) {
    const facilityName = _.get(payload, 'name')
    const countryCode = _.get(payload, 'result.data.Country')
    if (facilityName && countryCode) {
      const siteIds = yield query(
        'Get sites using country abbreviation and device name',
        knex
      )
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
          `Cannot uniquely determine which site this result came from using ${facilityName} in ${countryCode})`
        )
      }
      if (!site.id) {
        const country = yield query(
          'Get country using country abbreviation',
          knex
        )
          .from('Country as c')
          .where({ abbreviation: countryCode })
          .select()
        if (_.isEmpty(country)) {
          throw Boom.notFound(
            `Cannot determine the country from ${countryCode}.`
          )
        }
        const geography = yield query(
          'Get geography with only country ID',
          knex
        )
          .from('Geography as g')
          .where({ 'g.countryId': country.id })
          .whereNull('g.stateId')
          .whereNull('g.lgaId')
          .select('g.id')
          .first()
        if (_.isEmpty(geography)) {
          const [id] = yield query('Insert geography', knex)
            .insert({ countryId: country.id })
            .into('Geography')
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
        const [id] = yield query('Insert site', knex)
          .insert(newSite)
          .into('Site')
        site.id = id
      }
    } else {
      throw Boom.notFound('Cannot determine which site this result came from')
    }
  }
  return site
}

module.exports = preProcessMergeResult
