let camelize = require('camelize')
let Promise = require('bluebird')
let { knex, filterParams, sortPageParams } = require('../db')
let { getConstraints, addConstraints } = require('../auth/constraints')

const SELECT_LIST_FIELDS = [
  'd.id', 'd.name', 'd.shortname', 'd.created_on', 'd.last_ping_on', 'd.updated_on as last_seen',
  knex.raw('\'Active\' as status'),
  knex.raw('d.id * 134 as total_tests')
]

const SELECT_SHOW_FIELDS = [
  'd.id', 'd.name', 'd.shortname', 'd.created_on', 'd.last_ping_on', 'd.updated_on as last_seen',
  knex.raw('\'Active\' as status'),
  knex.raw('d.id * 134 as total_tests'),
  'd.site_id',
  // TODO: First Connected
  // TODO: First Approved On
  // TODO: First Approved By
  'd.notes',
  'd.serial'
]

function changeIdToString(item) {
  // FIXME: id should be always a String type. Maybe UUID?
  return Object.assign({}, item, {
    id: String(item.id)
  })
}

function* listDevices(request){
  let {query, auth} = request

  // get data constraints
  let dataConstraints = yield getConstraints(auth.credentials)

  let deviceQuery = knex('device as d')
    .modify(filterParams, query, 'name', 'd.name')
    .modify(addConstraints, dataConstraints, {device: 'd'})

  // get total count for paging
  let getCount = deviceQuery.clone()
    .count('d.id as count').first()

  // get rows
  let getItems = deviceQuery.clone()
    .modify(sortPageParams, query, 'name')
    .select(SELECT_LIST_FIELDS)

  // return result when both queries are finished
  let [{count: total}, data] = yield Promise.all([getCount, getItems])

  data = data.map(changeIdToString)

  let result = {ok: true, total, length: data.length, data}

  return camelize(result)
}

function* showDevice(request) {
  const {params} = request

  // get item
  const [item] = yield knex('device as d')
    .where('d.id', params.deviceId)
    .select(SELECT_SHOW_FIELDS)

  const result = {ok: true, data: changeIdToString(item)}

  return camelize(result)
}

function* updateDevice(request) {
  const {params, payload} = request

  // TODO: check permission

  // update item
  const updatedCount = yield knex('device')
    .where('id', params.deviceId)
    .returning(SELECT_SHOW_FIELDS)
    .update({
      name: payload.name,
      shortname: payload.shortname,
      notes: payload.notes,
      site_id: payload.siteId
    })

  if (updatedCount !== 1) {
    throw new Error('Unknown error')
  }

  return yield* showDevice(request)
}


module.exports = {
  listDevices,
  showDevice,
  updateDevice
}
