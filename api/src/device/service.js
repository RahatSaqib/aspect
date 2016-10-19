const Promise = require('bluebird')
const Boom = require('boom')
const { knex, filterParams, sortPageParams } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')

const SELECT_LIST_FIELDS = [
  'd.id', 'd.name', 'd.shortname', 'd.createdOn', 'd.lastPingOn', 'd.updatedOn as lastSeen',
  'dt.name as type', 'dc.name as category', 'dc.hasResults', 'dc.hasConnectivity',
  knex.raw('\'Active\' as status'),
  knex.raw('d.id * 134 as totalTests')
]

const SELECT_SHOW_FIELDS = [
  'd.id', 'd.name', 'd.shortname', 'd.createdOn', 'd.lastPingOn', 'd.updatedOn as lastSeen',
  'dt.name as type', 'dc.name as category', 'dc.hasResults', 'dc.hasConnectivity',
  knex.raw('\'Active\' as status'),
  knex.raw('d.id * 134 as totalTests'),
  'd.siteId',
  // TODO: First Connected
  // TODO: First Approved On
  // TODO: First Approved By
  'd.notes',
  'd.serial'
]

function* listDevices(request){
  let {query, auth} = request

  // get data constraints
  let dataConstraints = yield getConstraints(auth.credentials)

  let deviceQuery = knex('Device as d')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .innerJoin('DeviceTypeCategory as dc', 'dt.deviceTypeCategoryId', 'dc.id')
    .modify(filterParams, query, {  name: 'd.name',
                                    hasConnectivity: 'dc.hasConnectivity',
                                    hasResults: 'dc.hasResults',
                                    category: 'dc.name',
                                    type: 'dt.name' })
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

  let result = {ok: true, total, length: data.length, data}

  return result
}

function* getDeviceByDeviceId(request, fields=SELECT_SHOW_FIELDS){
  const {auth, params} = request
  const dataConstraints = yield getConstraints(auth.credentials)

  const devices = yield knex('Device as d')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .innerJoin('DeviceTypeCategory as dc', 'dt.deviceTypeCategoryId', 'dc.id')
    .where('d.id', params.deviceId)
    .modify(addConstraints, dataConstraints, {device: 'd'})
    .select(fields)
  return {ok: devices.length === 1, data: devices[0]}
}

function* showDevice(request) {
  const device = yield* getDeviceByDeviceId(request)
  return device.ok ? device : Boom.notFound()
}

function* updateDevice(request) {
  const {params, payload} = request

  // TODO: check permission

  // update item
  const updatedCount = yield knex('Device')
    .where('id', params.deviceId)
    .update({
      name: payload.name,
      shortname: payload.shortname,
      notes: payload.notes,
      siteId: payload.siteId
    })

  if (updatedCount !== 1) {
    throw new Error('Unknown error')
  }

  return yield* showDevice(request)
}

function* addDeviceOperation(request){
  return {ok: true}
}

function* listDeviceOperation(request){
  return {ok: true}
}

function* addDeviceConfiguration(request){
  return {ok: true}
}

function* listDeviceConfiguration(request){
  return {ok: true}
}


module.exports = {
  listDevices,
  showDevice,
  updateDevice,
  addDeviceOperation,
  listDeviceOperation,
  addDeviceConfiguration,
  listDeviceConfiguration
}
