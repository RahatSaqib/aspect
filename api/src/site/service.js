const Promise = require('bluebird')
const { knex, filterParams, filterDateRangeParams, sortPageParams } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')

const SELECT_LIST_FIELDS = [
  's.id', 's.name', 's.shortname',
  'st.name as state', 'l.name as lga',
  's.createdOn', knex.raw('s.id + 2 as totalDevices')
]

const SELECT_SHOW_FIELDS = [
  's.id', 's.name', 's.shortname',
  'st.name as state', 'l.name as lga', 'ct.name as country',
  's.createdOn', knex.raw('s.id + 2 as totalDevices'),

  's.countryId', 's.stateId', 's.lgaId',
  's.timezoneId as timezone', // FIXME?
  's.city', 's.zip', 's.street1', 's.street2',
  's.longitude', 's.latitude'
]

function* listSites(request) {
  const { query, auth } = request

  // get data constraints
  const dataConstraints = yield getConstraints(auth.credentials)

  const siteQuery = knex('Site as s')
    .leftOuterJoin('State as st', 's.stateId', 'st.id')
    .leftOuterJoin('Lga as l', 's.lgaId', 'l.id')
    .where(function () {
      if (!query.deviceName) {
        return
      }
      const deviceQuery = knex('Device as d')
        .select('d.siteId')
        .modify(filterParams, query, {
          deviceName: 'd.name'
        })

      this.whereIn('s.id', deviceQuery)
    })
    .modify(filterDateRangeParams, query, 's.createdOn')
    .modify(filterParams, query, {
      countryId: 's.countryId',
      stateId: 's.stateId',
      lgaId: 's.lgaId',
      siteName: 's.name'
    })
    .modify(addConstraints, dataConstraints, { site: 's', state: 'st', lga: 'l' })

  // get total count for paging
  const getCount = siteQuery.clone()
    .count('s.id as count').first()

  // get rows
  const getItems = siteQuery.clone()
    .modify(sortPageParams, query, 'name')
    .select(SELECT_LIST_FIELDS)

  // return result when both queries are finished
  const [{ count: total }, data] = yield Promise.all([getCount, getItems])

  const result = { ok: true, total, length: data.length, data }

  return result
}

function* showSite(request) {
  const { params } = request

  // get item
  const [item] = yield knex('Site as s')
    .leftOuterJoin('State as st', 's.stateId', 'st.id')
    .leftOuterJoin('Country as ct', 's.countryId', 'ct.id')
    .leftOuterJoin('Lga as l', 's.lgaId', 'l.id')
    .where('s.id', params.siteId)
    .select(SELECT_SHOW_FIELDS)

  const result = { ok: true, data: item }

  return result
}

function* updateSite(request) {
  const { params, payload } = request

  // TODO: check permission

  // update item
  const updatedCount = yield knex('Site')
    .where('id', params.siteId)
    .update({
      name: payload.name,
      shortname: payload.shortname,
      timezoneId: payload.timezone, // TODO
      street1: payload.street1,
      street2: payload.street2,
      countryId: payload.countryId,
      stateId: payload.stateId,
      lgaId: payload.lgaId,
      city: payload.city,
      zip: payload.zip,
      longitude: payload.longitude,
      latitude: payload.latitude
    })

  if (updatedCount !== 1) {
    throw new Error('Unknown error')
  }

  return yield* showSite(request)
}

module.exports = {
  listSites,
  showSite,
  updateSite
}
