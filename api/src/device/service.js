const Promise = require('bluebird')
const _ = require('lodash')
const Boom = require('boom')
const jwt = require('jsonwebtoken')
const { knex, filterParams, filterDateRangeParams, sortPageParams } = require('../db')
const config = require('../config')
const { getConstraints, addConstraints } = require('../auth/constraints')


const SELECT_LIST_FIELDS = [
  'd.id', 'd.name', 'd.shortname', 'd.createdOn', 'd.lastPingOn', 'd.updatedOn as lastSeen',
  'dt.name as type', 'dc.name as category', 'dc.hasResults', 'dc.hasConnectivity',
  knex.raw('\'Active\' as status')
]

const SELECT_SHOW_FIELDS = [
  'd.id', 'd.name', 'd.shortname', 'd.createdOn', 'd.lastPingOn', 'd.updatedOn as lastSeen',
  'dt.name as type', 'dc.name as category', 'dc.hasResults', 'dc.hasConnectivity',
  knex.raw('\'Active\' as status'),
  knex.raw('d.id * 134 as totalTests'),
  'd.siteId',
  // TODO: First Connected
  'd.approvedOn',
  'u.name as approvedBy',
  'd.notes',
  'd.serial'
]

function* listDevices(request){
  const {query, auth} = request

  // get data constraints
  const dataConstraints = yield getConstraints(auth.credentials)

  const deviceQuery = knex('Device as d')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .innerJoin('DeviceTypeCategory as dc', 'dt.deviceTypeCategoryId', 'dc.id')
    .innerJoin('Site as s', 'd.siteId', 's.id')
    .modify(function (queryBuilder) {
      if (!query.assayId) {
        return
      }
      queryBuilder
        .innerJoin('Assay as a', 'dt.id', 'a.deviceTypeId')
        .where('a.id', query.assayId)

      if (!query.resultCategoryId) {
        return
      }
      queryBuilder
        .innerJoin('ResultCategoryAssay as rca', 'a.id', 'rca.assayId')
        .where('rca.resultCategoryId', query.resultCategoryId)
    })
    .modify(filterParams, query, {
      countryId: 's.countryId',
      stateId: 's.stateId',
      lgaId: 's.lgaId',
      deviceName: 'd.name',
      hasConnectivity: 'dc.hasConnectivity',
      hasResults: 'dc.hasResults',
      category: 'dc.name',
      type: 'dt.name'
    })
    .modify(addConstraints, dataConstraints, {device: 'd'})

  // get total count for paging
  const getCount = deviceQuery.clone()
    .count('d.id as count').first()

  // get rows
  const getItems = deviceQuery.clone()
    .modify(sortPageParams, query, 'name')
    .select(SELECT_LIST_FIELDS)

  // return result when both queries are finished
  const [{count: total}, rawDevices] = yield Promise.all([getCount, getItems])

  // get resultsCount for all rawDevices
  const rawResultsCount = yield knex('Result as r')
    .whereIn('r.deviceId', _.map(rawDevices, 'id'))
    .modify(filterDateRangeParams, query, 'r.endedOn')
    .modify(filterParams, query, {
      assayId: 'r.assayId',
      resultCategoryId: 'r.resultCategory1'
    })
    .count('r.id as count')
    .select('r.deviceId')
    .groupBy('r.deviceId')

  const resultsCountByDeviceId = _.fromPairs(
    _.map(rawResultsCount, ({deviceId, count}) => [deviceId, count])
  )

  // assign device.totalTests with resultsCountByDeviceId or zero
  const data = _.map(rawDevices, (rawDevice) => {
    return _.assign({}, rawDevice, {
      totalTests: resultsCountByDeviceId[rawDevice.id] || 0
    })
  })

  const result = {ok: true, total, length: data.length, data}

  return result
}

function* getDeviceByDeviceId(request, fields=SELECT_SHOW_FIELDS){
  const {auth, params} = request
  const dataConstraints = yield getConstraints(auth.credentials)

  const devices = yield knex('Device as d')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .innerJoin('DeviceTypeCategory as dc', 'dt.deviceTypeCategoryId', 'dc.id')
    .leftOuterJoin('User as u', 'u.id', 'd.approvedBy')
    .where('d.id', +params.deviceId)
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

function* getDeviceApiKey(request){
  const {auth, params} = request
  const dataConstraints = yield getConstraints(auth.credentials)

  const devices = yield knex('DeviceApiKey as dak')
    .innerJoin('Device as d', 'dak.deviceId', 'd.id')
    .where({'d.id': +params.deviceId, 'dak.revoked': 0})
    .modify(addConstraints, dataConstraints, {device: 'd'})
    .select('dak.id as id')

  if(devices.length !== 1){
    return Boom.notFound()
  }

  const {id: dak} = devices[0]

  // create a new token
  const token = jwt.sign({dak}, config.secret)

  return {access: token}
}


function* listDeviceConfiguration(request){
  let {query, auth} = request

  // get data constraints
  let dataConstraints = yield getConstraints(auth.credentials)

  let configQuery = knex('DeviceConfiguration as dc')
    .leftJoin('Device as d', 'dc.deviceId', 'd.id')
    .modify(filterParams, query, {deviceId: 'd.id', deviceName: 'd.name'})
    .modify(addConstraints, dataConstraints, {device: 'd'})

  // get total count for paging
  let getCount = configQuery.clone()
    .count('dc.id as count').first()

  // get rows
  let getItems = configQuery.clone()
    .modify(sortPageParams, query, 'deviceName')
    .select('dc.id', 'dc.externalId', 'dc.createdOn', 'dc.data', 'dc.deviceId', 'd.name as deviceName')
    .map(item => Object.assign({}, item, {data: JSON.parse(item.data)}))

  // return result when both queries are finished
  let [{count: total}, data] = yield Promise.all([getCount, getItems])

  let result = {ok: true, total, length: data.length, data}

  return result
}


function* listDeviceOperation(request){
  let {query, auth} = request

  // get data constraints
  let dataConstraints = yield getConstraints(auth.credentials)

  let opQuery = knex('DeviceOperation as do')
    .leftJoin('Device as d', 'do.deviceId', 'd.id')
    .modify(filterParams, query, {deviceId: 'd.id', deviceName: 'd.name'})
    .modify(addConstraints, dataConstraints, {device: 'd'})

  // get total count for paging
  let getCount = opQuery.clone()
    .count('do.id as count').first()

  // get rows
  let getItems = opQuery.clone()
    .modify(sortPageParams, query, 'deviceName')
    .select('do.id', 'do.externalId', 'do.createdOn', 'do.data', 'do.deviceId', 'd.name as deviceName')
    .map(item => Object.assign({}, item, {data: JSON.parse(item.data)}))

  // return result when both queries are finished
  let [{count: total}, data] = yield Promise.all([getCount, getItems])

  let result = {ok: true, total, length: data.length, data}

  return result
}

module.exports = {
  listDevices,
  showDevice,
  updateDevice,
  getDeviceApiKey,
  listDeviceConfiguration,
  listDeviceOperation
}
