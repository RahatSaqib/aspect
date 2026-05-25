const _ = require('lodash')

const { knex, filterParams, sortPageParams } = require('../db')
const { groupToken } = require('../deviceApi/apiKey')
const { getConstraints, addConstraints } = require('../auth/constraints')
const { getUser } = require('../auth/service')
const { getDateTimeProjectionInTimeZoneIANA } = require('../shared/date')

function mapDeviceApiKeyAssociations(deviceApiKey, associations) {
  const devices = _.uniqBy(
    associations
      .filter(association => association.deviceId != null)
      .map(association => ({
        id: association.deviceId,
        name: association.device,
        siteId: association.siteId,
        siteName: association.site,
      })),
    'id'
  )

  const sites = _.uniqBy(
    associations
      .filter(association => association.siteId != null)
      .map(association => ({
        id: association.siteId,
        name: association.site,
      })),
    'id'
  )

  return {
    ...deviceApiKey,
    token: groupToken(deviceApiKey.token),
    devices,
    sites,
  }
}

function getDeviceApiKeySortColumnMapping() {
  return {
    createdOn: 'dak.createdOn',
    token: 'dak.token',
    partner: 'p.name',
    country: 'c.name',
    site: knex.raw('MIN(COALESCE(deviceSite.name, dakSite.name))'),
    device: knex.raw('MIN(d.name)'),
    revoked: 'dak.revoked',
  }
}

async function listDeviceApiKeys(request) {
  const { query, auth } = request
  const { timezoneIANA } = await getUser(auth.credentials.name)
  const dataConstraints = await getConstraints(auth.credentials)

  const dakQuery = knex('DeviceApiKey as dak')
    .leftJoin('Partner as p', 'dak.partnerId', 'p.id')
    .leftJoin('Geography as g', 'dak.geographyId', 'g.id')
    .leftJoin('Country as c', 'g.countryId', 'c.id')
    .leftJoin('Site as dakSite', 'dak.siteId', 'dakSite.id')
    .leftJoin('Device as d', 'd.deviceApiKeyId', 'dak.id')
    .leftJoin('Site as deviceSite', 'd.siteId', 'deviceSite.id')
    .modify(queryBuilder => {
      filterParams(queryBuilder, query, {
        countryId: 'g.countryId',
        stateId: 'g.stateId',
        partnerId: 'dak.partnerId',
        deviceApiKeyToken: 'dak.token',
        siteName: ['dakSite.name', 'deviceSite.name'],
        deviceName: 'd.name',
        revoked: 'dak.revoked',
      })
    })
    .modify(addConstraints, dataConstraints, {
      device: 'd',
      geography: 'g',
      partner: 'p',
      site: 'dakSite',
    })

  const getCount = dakQuery.clone().countDistinct('dak.id as count').first()

  const getDeviceApiKeyIds = dakQuery
    .clone()
    .groupBy('dak.id')
    .modify(sortPageParams, query, 'createdOn', getDeviceApiKeySortColumnMapping())
    .orderBy('dak.id', 'desc')
    .pluck('dak.id')

  const [{ count: total }, deviceApiKeyIds] = await Promise.all([getCount, getDeviceApiKeyIds])

  if (deviceApiKeyIds.length === 0) {
    return { ok: true, total, length: 0, data: [] }
  }

  const getItems = knex('DeviceApiKey as dak')
    .leftJoin('Partner as p', 'dak.partnerId', 'p.id')
    .leftJoin('Geography as g', 'dak.geographyId', 'g.id')
    .leftJoin('Country as c', 'g.countryId', 'c.id')
    .leftJoin('Site as dakSite', 'dak.siteId', 'dakSite.id')
    .whereIn('dak.id', deviceApiKeyIds)
    .select([
      'dak.id',
      getDateTimeProjectionInTimeZoneIANA(knex, 'dak.createdOn', timezoneIANA, 'createdOn'),
      'dak.token',
      'dak.revoked',
      'p.name as partner',
      'p.id as partnerId',
      'c.name as country',
      'c.id as countryId',
      'dakSite.name as site',
      'dakSite.id as siteId',
    ])

  const getAssociations = knex('Device as d')
    .leftJoin('Site as s', 'd.siteId', 's.id')
    .whereIn('d.deviceApiKeyId', deviceApiKeyIds)
    .select(['d.deviceApiKeyId', 'd.id as deviceId', 'd.name as device', 's.id as siteId', 's.name as site'])
    .orderBy('s.name', 'asc')
    .orderBy('d.name', 'asc')

  const [items, associations] = await Promise.all([getItems, getAssociations])

  const itemsById = _.keyBy(items, 'id')
  const associationsByDeviceApiKeyId = _.groupBy(associations, 'deviceApiKeyId')
  const data = deviceApiKeyIds.map(deviceApiKeyId =>
    mapDeviceApiKeyAssociations(itemsById[deviceApiKeyId], associationsByDeviceApiKeyId[deviceApiKeyId] || [])
  )

  return { ok: true, total, length: data.length, data }
}

module.exports = {
  listDeviceApiKeys,
}
