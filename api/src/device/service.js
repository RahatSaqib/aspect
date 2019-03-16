const _ = require('lodash')
const subDays = require('date-fns/sub_days')
const Boom = require('boom')

const { knex, filterParams, sortPageParams } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')
const { deviceStatusToId, resultCategoryToId } = require('../shared/dictionary')
const {
  getCellsByValue,
  generateExcelFile,
  generateCsvFile,
} = require('../shared/io')

const SELECT_LIST_FIELDS = [
  'd.id',
  'd.name',
  'd.shortName',
  'd.createdOn',
  'd.lastPingOn',
  'd.lastSeenOn as lastSeen',
  'st.name as state',
  'dt.name as type',
  's.name as siteName',
  'ds.name as status',
  'dc.name as category',
  'dc.hasResults',
  'dc.hasConnectivity',
]

const SELECT_SHOW_FIELDS = [
  'd.id',
  'd.name',
  'd.shortName',
  'd.createdOn',
  'd.lastPingOn',
  'd.lastSeenOn as lastSeen',
  'dt.name as type',
  'ds.name as status',
  'ds.token as statusToken',
  'dc.name as category',
  'dc.hasResults',
  'dc.hasConnectivity',
  'd.siteId',
  's.name as siteName',
  'd.hostId',
  'd.deviceTypeId',
  'd.deviceStatusId',
  'd.configurationData',
  'd.notes',
  'd.serial',
  'dt.id as deviceTypeId',
  'dt.name as deviceTypeName',
  'dt.externalId as deviceTypeExternalId',
  'dt.configurationDataSchema',
  'dt.deviceOperationSchema',
  'dp.dailyCapacity',
  'frd30.resultCount as resultCount30',
  'frd60.resultCount as resultCount60',
  knex.raw('ifnull(frd30Errors.resultCount, 0) as errorCount30'),
  knex.raw('ifnull(frd60Errors.resultCount, 0) as errorCount60'),
]

// ---------------------------------
// basic method for reading dataset of devices
// ---------------------------------
async function getListDevices(query, auth) {
  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)

  const resultCategoryErrorId = await resultCategoryToId('Error')

  const deviceQuery = knex('Device as d')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .innerJoin('DeviceStatus as ds', 'd.deviceStatusId', 'ds.id')
    .innerJoin('DeviceTypeCategory as dc', 'dt.deviceTypeCategoryId', 'dc.id')
    .innerJoin('Site as s', 'd.siteId', 's.id')
    .leftJoin('FactResultsDevice as frd30', function() {
      this.on('d.id', 'frd30.deviceId').andOn('frd30.days', 30)
    })
    .leftJoin('FactResultsDevice as frd60', function() {
      this.on('d.id', 'frd60.deviceId').andOn('frd60.days', 60)
    })
    .leftJoin('FactResultsDeviceByCategory1 as frd30Errors', function() {
      this.on('d.id', 'frd30Errors.deviceId')
        .andOn('frd30Errors.days', 30)
        .andOn('frd30Errors.resultCategory1', resultCategoryErrorId)
    })
    .leftJoin('Geography as g', 's.geographyId', 'g.id')
    .leftJoin('State as st', 'g.stateId', 'st.id')
    .where(function() {
      if (!query.deviceIds) {
        return
      }
      this.whereIn('d.id', query.deviceIds.split(','))
    })
    .modify(queryBuilder => {
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
      deviceStatusId: 'd.deviceStatusId',
      deviceTypeId: 'd.deviceTypeId',
      hasConnectivity: 'dc.hasConnectivity',
      hasResults: 'dc.hasResults',
      category: 'dc.name',
      type: 'dt.name',
      siteExternalId: 's.externalId',
      siteName: 's.name',
    })
    .modify(addConstraints, dataConstraints, { device: 'd' })

  // get total count for paging
  const getCount = deviceQuery
    .clone()
    .count('d.id as count')
    .first()

  const last30Day = subDays(new Date(), 30)
  const last60Day = subDays(last30Day, 30)

  // get rows
  const getItems = deviceQuery
    .clone()
    .modify(sortPageParams, query, 'name')
    .select([
      ...SELECT_LIST_FIELDS,
      'frd30.resultCount as thisMonth',
      knex.raw('frd60.resultCount - frd30.resultCount as lastMonth'),
      'frd30Errors.resultCount as thisMonthErrors',
      knex('Result as r')
        .innerJoin('Sample as s', 'r.sampleId', 's.id')
        .innerJoin('ResultWorkflowLog as rl', 'r.id', 'rl.resultId')
        .innerJoin(
          'ResultWorkflowStatus as rw',
          'rl.resultWorkflowStatusId',
          'rw.id'
        )
        .whereRaw('s.originSiteId = d.siteId')
        .whereBetween('rl.changedOn', [last60Day, last30Day])
        .where('rw.externalId', '=', 'Delivered')
        .countDistinct('r.id')
        .as('deliveredLastMonth'),
      knex('Result as r')
        .innerJoin('Sample as s', 'r.sampleId', 's.id')
        .innerJoin('ResultWorkflowLog as rl', 'r.id', 'rl.resultId')
        .innerJoin(
          'ResultWorkflowStatus as rw',
          'rl.resultWorkflowStatusId',
          'rw.id'
        )
        .whereRaw('s.originSiteId = d.siteId')
        .where('rl.changedOn', '>=', last30Day)
        .where('rw.externalId', '=', 'Delivered')
        .countDistinct('r.id')
        .as('deliveredThisMonth'),
      // get csv of issue types
      knex('Issue as i1')
        .leftOuterJoin('IssueType as it', 'i1.issueTypeId', 'it.id')
        .leftOuterJoin('IssueStatus as ist', 'i1.issueStatusId', 'ist.id')
        .leftOuterJoin('IssueCategory as ic', 'it.issueCategoryId', 'ic.id')
        .whereRaw('i1.deviceId = d.id')
        // skip IssueStatus 'Inactive', 'OK' or 'Resolved'
        .whereNotIn('ist.externalId', ['Inactive', 'OK', 'Resolved'])
        .select(knex.raw(`GROUP_CONCAT(DISTINCT ic.i18nKey)`))
        .as('issueCategories'),
    ])

  // return result when both queries are finished
  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  data.forEach(it => {
    // FIXME: Use actual data instead
    it.availability = {
      count: _.random(25, 30),
      total: 30,
    }
    it.error = {
      count: it.thisMonthErrors,
      total: it.thisMonth,
    }
    it.alerts = it.issueCategories
      ? it.issueCategories.split(',').map(key => ({ key }))
      : []
  })

  const result = { ok: true, total, length: data.length, data }

  return result
}

// ---------------------------------
// reading dataset for Devices grid
// ---------------------------------
async function listDevices(request) {
  const { query, auth } = request

  // get dataset for current query params (sorting, filtering and pagination) and auth constraints
  const result = await getListDevices(query, auth)

  return result
}

async function getDeviceByDeviceId(request, fields = SELECT_SHOW_FIELDS) {
  const { auth, params } = request
  const dataConstraints = await getConstraints(auth.credentials)

  const resultCategoryErrorId = await resultCategoryToId('Error')

  const device = await knex('Device as d')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .innerJoin('DeviceStatus as ds', 'd.deviceStatusId', 'ds.id')
    .innerJoin('DeviceTypeCategory as dc', 'dt.deviceTypeCategoryId', 'dc.id')
    .innerJoin('Site as s', 'd.siteId', 's.id')
    .leftJoin('DeviceCapacity as dp', 'd.deviceCapacityId', 'dp.id')
    .leftJoin('FactResultsDevice as frd30', function() {
      this.on('d.id', 'frd30.deviceId').andOn('frd30.days', 30)
    })
    .leftJoin('FactResultsDevice as frd60', function() {
      this.on('d.id', 'frd60.deviceId').andOn('frd60.days', 60)
    })
    .leftJoin('FactResultsDeviceByCategory1 as frd30Errors', function() {
      this.on('d.id', 'frd30Errors.deviceId')
        .andOn('frd30Errors.days', 30)
        .andOn('frd30Errors.resultCategory1', resultCategoryErrorId)
    })
    .leftJoin('FactResultsDeviceByCategory1 as frd60Errors', function() {
      this.on('d.id', 'frd60Errors.deviceId')
        .andOn('frd60Errors.days', 60)
        .andOn('frd60Errors.resultCategory1', resultCategoryErrorId)
    })
    .where('d.id', +params.deviceId)
    .modify(addConstraints, dataConstraints, { device: 'd' })
    .first(fields)

  if (!device) {
    return null
  }

  device.configurationData = JSON.parse(device.configurationData) || {}
  device.deviceType = {
    name: device.deviceTypeName,
    configurationDataSchema: JSON.parse(device.configurationDataSchema) || {},
    deviceOperationSchema: JSON.parse(device.deviceOperationSchema) || {},
  }

  device.resultCountLastMonth = device.resultCount60 - device.resultCount30
  device.errorCountLastMonth = device.errorCount60 - device.errorCount30

  return device
}

async function showDevice(request) {
  const device = await getDeviceByDeviceId(request)

  if (!device) {
    return Boom.notFound()
  }

  const result = {
    ok: true,
    data: device,
  }

  return result
}

async function updateDevice(request) {
  const { params, payload } = request

  // TODO: check permission

  const device = await getDeviceByDeviceId(request)

  const configurationData = _.assign(
    {},
    device.configurationData,
    payload.configurationData
  )

  let { deviceStatusId } = device
  // check if a statusToken is provided
  if (
    _.has(payload, 'statusToken') &&
    device.statusToken !== payload.statusToken
  ) {
    deviceStatusId = await deviceStatusToId(payload.statusToken)
  }

  // update item
  const updatedCount = await knex('Device')
    .where('id', params.deviceId)
    .update({
      siteId: device.siteId || payload.siteId,
      deviceStatusId,
      configurationData: JSON.stringify(configurationData),
    })

  if (updatedCount !== 1) {
    return Boom.badRequest()
  }

  const result = await showDevice(request)
  return result
}

// ---------------------------------
// exporting Devices data
// ---------------------------------
async function exportDevices(request) {
  const { query, auth } = request

  // ---------------
  // change query page/size values to get whole dataset (not only currently paged items)
  query.page = 0
  // do not export more than 100.000 records
  query.size = 1e5

  // get whole dataset - based on current query params (sorting, filtering) and auth constraints
  const devices = await getListDevices(query, auth)

  let result = null

  if (query.format === 'excel') {
    // fill in data into given workbook
    const populateData = workbook => {
      // get 1st sheet (1-based)
      const worksheet = workbook.getWorksheet(1)

      // locate cell(s) with needed value
      const cells = getCellsByValue(worksheet, '<DeviceListRows>')
      if (cells.length > 0) {
        // empty such cells
        cells.forEach(cell => {
          cell.value = ''
        })

        // use 1st cell only (actually, should not be more than one)
        const patternRowNumber = cells[0].row + 2

        // fill in array 'rows'
        const rows = []
        devices.data.forEach(d => {
          // ------
          // --->>> order of array elements should match columns order in template file
          // ------
          rows.push([d.name, d.status, d.createdOn, d.lastSeen, d.totalTests])
        })

        // insert rows from patternRowNumber, and remove row number 'patternRowNumber'
        worksheet.spliceRows(patternRowNumber, 1, ...rows)
      }
    }

    result = await generateExcelFile({
      templateFileName: 'Devices.xlsx',
      outputFileName: 'devices.xlsx',
      populateData,
    })
  } else if (query.format === 'csv') {
    const items = devices.data
    const columnNames = [
      'Device Name',
      'Short Name',
      'Status',
      'Created On',
      'Last Seen',
      'Type',
      'Category',
      'Connected',
      'Total Tests',
    ]
    const fieldNames = [
      'name',
      'shortName',
      'status',
      'createdOn',
      'lastSeen',
      'type',
      'category',
      'hasConnectivity',
      'totalTests',
    ]
    result = await generateCsvFile(
      'devices.csv',
      items,
      columnNames,
      fieldNames
    )
  }

  return result
}

async function listStatusTypes() {
  const resultQuery = knex('DeviceStatus as ds')

  // get total count for paging
  const getCount = resultQuery
    .clone()
    .count('ds.id as count')
    .first()

  // get rows
  const getItems = resultQuery
    .clone()
    .orderBy('id', 'asc')
    .select('id', 'name')

  // return result when both queries are finished
  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  const result = { ok: true, total, length: data.length, data }

  return result
}

async function listDevicesForSelectList(request) {
  const { query, auth } = request

  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)

  const devices = await knex('Device as d')
    .leftOuterJoin('Geography as g', 'd.geographyId', 'g.id')
    .modify(addConstraints, dataConstraints, { device: 'd' })
    .modify(filterParams, query, {
      countryId: 'g.countryId',
      partnerId: 'd.partnerId',
      siteId: 'd.siteId',
    })
    .orderBy(['d.name'], 'asc')
    .select('d.id', 'd.name')

  return { ok: true, data: devices }
}

async function getDevice(deviceId) {
  const device = await knex('Device as d')
    .where('d.id', deviceId)
    .first()
  return device
}

module.exports = {
  listDevices,
  showDevice,
  updateDevice,
  listStatusTypes,
  exportDevices,
  listDevicesForSelectList,
  getDevice,
}
