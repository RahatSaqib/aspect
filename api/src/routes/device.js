let camelize = require('camelize')
let Promise = require('bluebird')
let Joi = require('joi')
let { knex, filterParams, sortPageParams } = require('../db')
let { asyncHandler, validateSortPageParams } = require('../util')

module.exports = [{
  method: 'GET',
  path: '/device',
  handler: asyncHandler(listDevices),
  config: {
    description: 'Device List',
    notes: 'Pageable and sortable list of devices',
    validate: {
      query: Object.assign({
        name: Joi.string().allow('').description('Filter for device name')
      }, validateSortPageParams('name', 'status', 'createdOn', 'lastSeen', 'totalTests'))
    }
  }
}, {
  method: 'GET',
  path: '/device/{deviceId}',
  handler: asyncHandler(showDevice),
  config: {
    description: 'Device Detail',
    notes: 'Detail of a device',
    validate: {
      params: {
        deviceId: Joi.string().description('Device id')
      }
    }
  }
}]

const SELECT_FIELDS = [
  'id', 'name', 'shortname', 'created_on', 'last_ping_on', 'updated_on as last_seen',
  knex.raw('\'Active\' as status'),
  knex.raw('id * 134 as total_tests')
]

function changeIdToString(item) {
  // FIXME: id should be always a String type. Maybe UUID?
  return Object.assign({}, item, {
    id: String(item.id)
  })
}

function* listDevices(request){
  let {query} = request

  // get total count for paging
  let getCount = knex('device')
    .modify(filterParams, query, 'name')
    .count('id as count').first()

  // get rows
  let getItems = knex('device')
    .modify(filterParams, query, 'name')
    .modify(sortPageParams, query, 'name')
    .select(SELECT_FIELDS)

  // return result when both queries are finished
  let [{count: total}, data] = yield Promise.all([getCount, getItems])

  data = data.map(changeIdToString)

  let result = {ok: true, total, length: data.length, data}

  return camelize(result)
}

function* showDevice(request) {
  const {params} = request

  // get item
  const [item] = yield knex('device')
    .where('id', params.deviceId)
    .select([
      ...SELECT_FIELDS,
      'site_id',
      // TODO: First Connected
      // TODO: First Approved On
      // TODO: First Approved By
      'serial'
    ])

  const result = {ok: true, data: changeIdToString(item)}

  return camelize(result)
}
