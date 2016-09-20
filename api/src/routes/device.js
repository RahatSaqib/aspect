let camelize = require('camelize')
let Promise = require('bluebird')
let Joi = require('joi')
let { knex, filterParams, sortPageParams } = require('../db')
let { asyncHandler, validateSortPageParams } = require('../util')
let { getConstraints, addConstraints } = require('../constraints')

module.exports = [
  {
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
  },
  {
    method: 'GET',
    path: '/device/{deviceId}',
    handler: asyncHandler(showDevice),
    config: {
      description: 'Device Detail',
      notes: 'Detail of a device',
      validate: {
        params: {
          deviceId: Joi.string().description('Device id').required()
        }
      }
    }
  },
  {
    method: 'PUT',
    path: '/device/{deviceId}',
    handler: asyncHandler(updateDevice),
    config: {
      description: 'Update Device Detail',
      notes: 'Detail of a device',
      validate: {
        params: {
          deviceId: Joi.string().description('Device id').required()
        },
        payload: {
          name: Joi.string().required(),
          shortname: Joi.string().required(),
          notes: Joi.string().required(),
          siteId: Joi.number().required()
        }
      }
    }
  }
]

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
  let dataConstraints = yield getConstraints(auth.credentials.name)

  let deviceQuery = knex('device as d')
    .leftOuterJoin('site as s', 'd.site_id', 's.id')
    .leftOuterJoin('state as st', 's.state_id', 'st.id')
    .leftOuterJoin('lga as l', 's.lga_id', 'l.id')
    .modify(filterParams, query, 'name')
    .modify(addConstraints, dataConstraints, {state: 'st', lga: 'l'})

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
  const [item] = yield knex('device')
    .where('id', params.deviceId)
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
