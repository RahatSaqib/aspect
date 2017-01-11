const Promise = require('bluebird')
const _ = require('lodash')
const Boom = require('boom')

const { knex, filterParams, filterDateRangeParams, sortPageParams } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')
const { getCellsByValue, generateExcelFile, generateCsvFile } = require('../shared/io')

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
  's.name as siteName',
  'd.hostId',
  // TODO: First Connected
  'd.approvedOn',
  'u.name as approvedBy',
  'd.deviceTypeId',
  'd.configurationData',
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
    .leftJoin('Geography as g', 's.geographyId', 'g.id')
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
      countryId: 'g.countryId',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      deviceName: 'd.name',
      hasConnectivity: 'dc.hasConnectivity',
      hasResults: 'dc.hasResults',
      category: 'dc.name',
      type: 'dt.name',
      siteExternalId: 's.externalId',
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
    .innerJoin('Site as s', 'd.siteId', 's.id')
    .leftOuterJoin('User as u', 'u.id', 'd.approvedBy')
    .where('d.id', +params.deviceId)
    .modify(addConstraints, dataConstraints, { device: 'd' })
    .select(fields)

  if (devices.length === 1) {
    const device = devices[0]
    const deviceType = yield knex('DeviceType as dt').where('dt.id', device.deviceTypeId).first()
    deviceType.configurationDataSchema = JSON.parse(deviceType.configurationDataSchema) || {}
    deviceType.deviceOperationSchema = JSON.parse(deviceType.deviceOperationSchema) || {}

    device.configurationData = JSON.parse(device.configurationData) || {}
    device.deviceType = deviceType
    device.deviceOperations = yield knex('DeviceOperation as do')
      .where('do.deviceId', device.id)
      .limit(10)
      .orderBy('do.startedOn', 'desc')
      .map(deviceOperation => _.assign(deviceOperation, {
        data: JSON.parse(deviceOperation.data) || {}
      }))

    const contacts = yield knex('Person as p')
      .select('p.id', 'p.name')
      .limit(50)

    device.contacts = _.times(3, () => contacts.splice(_.random(0, contacts.length - 1), 1)[0])

    return {
      ok: true,
      data: device
    }
  }
  return {
    ok: false
  }
}

function* showDevice(request) {
  const device = yield* getDeviceByDeviceId(request)
  return device.ok ? device : Boom.notFound()
}

function* updateDevice(request) {
  const { params, payload } = request

  // TODO: check permission

  const device = yield* showDevice(request)

  const configurationData = _.assign({}, device.configurationData, payload.configurationData)

  // update item
  const updatedCount = yield knex('Device')
    .where('id', params.deviceId)
    .update({
      name: payload.name,
      shortname: payload.shortname,
      notes: payload.notes,
      siteId: payload.siteId,
      configurationData: JSON.stringify(configurationData)
    })

  if (updatedCount !== 1) {
    return Boom.badRequest()
  }

  return yield* showDevice(request)
}


// ---------------------------------
// exporting Devices data
// ---------------------------------
function* exportDevices(request) {
  const { query, auth } = request

  // ---------------
  // change query page/size values to get whole dataset (not only currently paged items)
  query.page = 0
  // do not export more than 100.000 records
  query.size = 1e5

  // get whole dataset - based on current query params (sorting, filtering) and auth constraints
  const devices = yield* getListDevices(query, auth)

  let result = null

  if (query.format === 'excel') {
    // fill in data into given workbook
    const populateData = (workbook) => {
      // get 1st sheet (1-based)
      const worksheet = workbook.getWorksheet(1)

      // locate cell(s) with needed value
      const cells = getCellsByValue(worksheet, '<DeviceListRows>')
      if (cells.length > 0) {
        // empty such cells
        cells.forEach((cell) => { cell.value = '' })

        // use 1st cell only (actually, should not be more than one)
        const patternRowNumber = cells[0].row + 2

        // fill in array 'rows'
        const rows = []
        devices.data.forEach((d) => {
          // ------
          // --->>> order of array elements should match columns order in template file
          // ------
          rows.push([
            d.name,
            d.status,
            d.createdOn,
            d.lastSeen,
            d.totalTests
          ])
        })

        // insert rows from patternRowNumber, and remove row number 'patternRowNumber'
        worksheet.spliceRows(patternRowNumber, 1, ...rows)
      }
    }

    result = yield* generateExcelFile({
      templateFileName: 'Devices.xlsx',
      outputFileName: 'devices.xlsx',
      populateData
    })
  } else if (query.format === 'csv') {
    const items = devices.data
    const columnNames = ['Device Name', 'Short Name', 'Status', 'Created On', 'Last Seen', 'Type', 'Category', 'Connected', 'Total Tests']
    const fieldNames = ['name', 'shortName', 'status', 'createdOn', 'lastSeen', 'type', 'category', 'hasConnectivity', 'totalTests']
    result = yield* generateCsvFile('devices.csv', items, columnNames, fieldNames)
  }

  return result
}

module.exports = {
  listDevices,
  showDevice,
  updateDevice,
  exportDevices
}
