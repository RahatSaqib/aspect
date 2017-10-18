const _ = require('lodash')
const Promise = require('bluebird')
const {
  knex,
  filterParams,
  filterDateRangeParams,
  sortPageParams,
} = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')
const { transformGeographyFromUpdates } = require('../geography/service')

const totalDevicesQuery = knex('Device as d')
  .whereRaw('d.siteId = s.id')
  .count('d.siteId')
  .as('totalDevices')

const SELECT_LIST_FIELDS = [
  's.id',
  's.name',
  's.shortname',
  'st.name as state',
  'l.name as lga',
  's.createdOn',
  totalDevicesQuery,
  's.externalId',
]

const SELECT_SHOW_FIELDS = [
  's.id',
  's.name',
  's.shortname',
  's.externalId',
  'st.name as state',
  'l.name as lga',
  'ct.name as country',
  's.createdOn',
  totalDevicesQuery,
  'g.countryId',
  'g.stateId',
  'g.lgaId',
  's.timezoneId as timezone', // FIXME?
  's.city',
  's.zip',
  's.street1',
  's.street2',
  's.longitude',
  's.latitude',
]

function* listSites(request) {
  const { query, auth } = request

  // get data constraints
  const dataConstraints = yield getConstraints(auth.credentials)

  const siteQuery = knex('Site as s')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .leftOuterJoin('State as st', 'g.stateId', 'st.id')
    .leftOuterJoin('Lga as l', 'g.lgaId', 'l.id')
    .where(function() {
      if (!query.siteIds) {
        return
      }
      this.whereIn('s.id', query.siteIds.split(','))
    })
    .where(function() {
      if (!query.deviceName) {
        return
      }
      const deviceQuery = knex('Device as d')
        .select('d.siteId')
        .modify(filterParams, query, {
          deviceName: 'd.name',
        })

      this.whereIn('s.id', deviceQuery)
    })
    .modify(filterDateRangeParams, query, 's.createdOn')
    .modify(filterParams, query, {
      countryId: 'g.countryId',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      siteName: 's.name',
      externalId: 's.externalId',
    })
    .modify(addConstraints, dataConstraints, { site: 's', geography: 'g' })

  // get total count for paging
  const getCount = siteQuery.clone().count('s.id as count').first()

  // get rows
  const getItems = siteQuery
    .clone()
    .modify(sortPageParams, query, 'name')
    .select(SELECT_LIST_FIELDS)

  // return result when both queries are finished
  const [{ count: total }, data] = yield Promise.all([getCount, getItems])

  const result = { ok: true, total, length: data.length, data }

  return result
}

function getSite(siteId, dataConstraints) {
  return knex('Site as s')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .leftOuterJoin('State as st', 'g.stateId', 'st.id')
    .leftOuterJoin('Country as ct', 'g.countryId', 'ct.id')
    .leftOuterJoin('Lga as l', 'g.lgaId', 'l.id')
    .where('s.id', siteId)
    .modify(addConstraints, dataConstraints, { site: 's', geography: 'g' })
    .first(SELECT_SHOW_FIELDS)
}

function* showSite(request) {
  const { params, auth } = request

  const dataConstraints = yield getConstraints(auth.credentials)

  // get item
  const item = yield getSite(params.siteId, dataConstraints)

  const result = { ok: true, data: item }

  return result
}

function* updateSite(request) {
  const { params, payload } = request

  // TODO: check permission

  const changedSiteFields = yield* transformGeographyFromUpdates(payload)

  // update item
  const updatedCount = yield knex('Site').where('id', params.siteId).update(
    Object.assign(
      _.pick(changedSiteFields, [
        'name',
        'shortname',
        'externalId',
        'street1',
        'street2',
        'geographyId',
        'city',
        'state',
        'zip',
        'latitude',
        'longitude',
      ]),
      { timezoneId: changedSiteFields.timezone } // TODO standardize timezone name
    )
  )

  if (updatedCount !== 1) {
    throw new Error('Unknown error')
  }

  return yield* showSite(request)
}

function* listSitesForSelectList(request) {
  const { auth } = request

  // get data constraints
  const dataConstraints = yield getConstraints(auth.credentials)

  const sites = yield knex('Site as s')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .modify(addConstraints, dataConstraints, { site: 's', geography: 'g' })
    .orderBy(['s.name'], 'asc')
    .select('s.id', 's.name', 's.partnerId', 'g.countryId')

  return { ok: true, data: sites }
}

module.exports = {
  listSites,
  getSite,
  showSite,
  updateSite,
  listSitesForSelectList,
}
