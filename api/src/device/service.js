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

// ---------------------------------
// basic method for reading dataset of devices
// ---------------------------------
function* getListDevices(query, auth) {
  // get data constraints
  const dataConstraints = yield getConstraints(auth.credentials)

  const deviceQuery = knex('Device as d')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .innerJoin('DeviceTypeCategory as dc', 'dt.deviceTypeCategoryId', 'dc.id')
    .innerJoin('Site as s', 'd.siteId', 's.id')
    .modify((queryBuilder) => {
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
    .modify(addConstraints, dataConstraints, { device: 'd' })

  // get total count for paging
  const getCount = deviceQuery.clone()
    .count('d.id as count').first()

  // get rows
  const getItems = deviceQuery.clone()
    .modify(sortPageParams, query, 'name')
    .select(SELECT_LIST_FIELDS)

  // return result when both queries are finished
  const [{ count: total }, rawDevices] = yield Promise.all([getCount, getItems])

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
    _.map(rawResultsCount, ({ deviceId, count }) => [deviceId, count])
  )

  // assign device.totalTests with resultsCountByDeviceId or zero
  const data = _.map(rawDevices, rawDevice => _.assign({}, rawDevice, {
    totalTests: resultsCountByDeviceId[rawDevice.id] || 0
  }))

  const result = { ok: true, total, length: data.length, data }

  return result
}

// ---------------------------------
// reading dataset for Devices grid
// ---------------------------------
function* listDevices(request) {
  const { query, auth } = request

  // get dataset for current query params (sorting, filtering and pagination) and auth constraints
  const result = yield* getListDevices(query, auth)

  return result
}

function* getDeviceByDeviceId(request, fields = SELECT_SHOW_FIELDS) {
  const { auth, params } = request
  const dataConstraints = yield getConstraints(auth.credentials)

  const devices = yield knex('Device as d')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .innerJoin('DeviceTypeCategory as dc', 'dt.deviceTypeCategoryId', 'dc.id')
    .leftOuterJoin('User as u', 'u.id', 'd.approvedBy')
    .where('d.id', +params.deviceId)
    .modify(addConstraints, dataConstraints, { device: 'd' })
    .select(fields)
  return { ok: devices.length === 1, data: devices[0] }
}

function* showDevice(request) {
  const device = yield* getDeviceByDeviceId(request)
  return device.ok ? device : Boom.notFound()
}

function* updateDevice(request) {
  const { params, payload } = request

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

function* getDeviceApiKey(request) {
  const { auth, params } = request
  const dataConstraints = yield getConstraints(auth.credentials)

  const devices = yield knex('DeviceApiKey as dak')
    .innerJoin('Device as d', 'dak.deviceId', 'd.id')
    .where({ 'd.id': +params.deviceId, 'dak.revoked': 0 })
    .modify(addConstraints, dataConstraints, { device: 'd' })
    .select('dak.id as id')

  if (devices.length !== 1) {
    return Boom.notFound()
  }

  const { id: dak } = devices[0]

  // create a new token
  const token = jwt.sign({ dak }, config.secret)

  return { access: token }
}


function* listDeviceConfiguration(request) {
  const { query, auth } = request

  // get data constraints
  const dataConstraints = yield getConstraints(auth.credentials)

  const configQuery = knex('DeviceConfiguration as dc')
    .leftJoin('Device as d', 'dc.deviceId', 'd.id')
    .modify(filterParams, query, { deviceId: 'd.id', deviceName: 'd.name' })
    .modify(addConstraints, dataConstraints, { device: 'd' })

  // get total count for paging
  const getCount = configQuery.clone()
    .count('dc.id as count').first()

  // get rows
  const getItems = configQuery.clone()
    .modify(sortPageParams, query, 'deviceName')
    .select('dc.id', 'dc.externalId', 'dc.createdOn', 'dc.data', 'dc.deviceId', 'd.name as deviceName')
    .map(item => Object.assign({}, item, { data: JSON.parse(item.data) }))

  // return result when both queries are finished
  const [{ count: total }, data] = yield Promise.all([getCount, getItems])

  const result = { ok: true, total, length: data.length, data }

  return result
}


function* listDeviceOperation(request) {
  const { query, auth } = request

  // get data constraints
  const dataConstraints = yield getConstraints(auth.credentials)

  const opQuery = knex('DeviceOperation as do')
    .leftJoin('Device as d', 'do.deviceId', 'd.id')
    .modify(filterParams, query, { deviceId: 'd.id', deviceName: 'd.name' })
    .modify(addConstraints, dataConstraints, { device: 'd' })

  // get total count for paging
  const getCount = opQuery.clone()
    .count('do.id as count').first()

  // get rows
  const getItems = opQuery.clone()
    .modify(sortPageParams, query, 'deviceName')
    .select('do.id', 'do.externalId', 'do.createdOn', 'do.data', 'do.deviceId', 'd.name as deviceName')
    .map(item => Object.assign({}, item, { data: JSON.parse(item.data) }))

  // return result when both queries are finished
  const [{ count: total }, data] = yield Promise.all([getCount, getItems])

  const result = { ok: true, total, length: data.length, data }

  return result
}


function createDirectory(path){
  const fs = require('fs')
  const folderNames = path.split('/')

  // loop paths and make sure all exist
  let dirPath = '.'
  folderNames.forEach((name,index) => {
    dirPath += '/' + name
    if (!fs.existsSync(dirPath)){
      fs.mkdirSync(dirPath)
    }
  })

  return path
}

function getExportDirectory(){
  const dt = new Date()
  const uuid = require('node-uuid')

  // pattern for random directory is temp/YYYY-MM-DD/HH/uuid, using time-based UUID (v1)
  const dirPath = `temp/${dt.getUTCFullYear()}-${dt.getUTCMonth()+1}-${dt.getUTCDate()}/${dt.getUTCHours()}/${uuid.v1()}`
  //---memo--------
  // time part (YYYY-MM-DD/HH) allows auto-deleting old folders by external process - i.e. every 2 hours delete folders from 2-hours back
  // if lots of files are being generated (millions every hour) - may add MM for tracking minutes too
  //-----------
  return createDirectory(dirPath)
}


function* exportDevices(request){

  const json2csv = require('json2csv')
  const fs = require('fs')
  const path = require('path')

  const { query, auth } = request

  // ---------------
  // change query page/size values to get whole dataset (not only currently paged items)
  query.page = 0
  // do not export more than 100.000 records
  query.size = 1e5

  // get whole dataset - based on current query params (sorting, filtering) and auth constraints
  const result = yield* getListDevices(query, auth)

  let ok = false
  let url = ''
  let message = null
  if (query.format === 'excel'){
    // -----------------
    // TODO after completing client-side
    // -----------------
  }
  else if (query.format === 'csv'){
    const fields = ['name', 'shortName', 'status', 'createdOn', 'lastSeen', 'type', 'category', 'hasConnectivity',  'totalTests']
    const fieldNames = ['Device Name', 'Short Name', 'Status', 'Created On', 'Last Seen', 'Type', 'Category', 'Connected',  'Total Tests']

    const csv = json2csv({ data: result.data, fields: fields, fieldNames: fieldNames })
    const dir = getExportDirectory()
    url = `${dir}/file.csv`

    fs.writeFileSync(url, csv)

    ok = true
    url = '/' + url
  }

  return { ok: ok, url: url, message: message }
}

module.exports = {
  listDevices,
  showDevice,
  updateDevice,
  getDeviceApiKey,
  listDeviceConfiguration,
  listDeviceOperation,
  exportDevices
}
