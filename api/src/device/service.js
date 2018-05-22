const _ = require('lodash')
const subDays = require('date-fns/sub_days')
const Boom = require('boom')

const { knex, filterParams, sortPageParams } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')
const {
  getCellsByValue,
  generateExcelFile,
  generateCsvFile,
} = require('../shared/io')
const {
  operationalDashboard /* FIXME: actual impl */,
} = require('../dashboard/service')
const { deviceOnline, deviceOffline } = require('./actions')

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
  // TODO: First Connected
  'd.deviceTypeId',
  'd.deviceStatusId',
  'd.configurationData',
  'd.notes',
  'd.serial',
]

const deviceMaintenanceStatusAction = {
  online: deviceOnline,
  offline: deviceOffline,
}

// ---------------------------------
// basic method for reading dataset of devices
// ---------------------------------
async function getListDevices(query, auth) {
  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)

  const deviceQuery = knex('Device as d')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .innerJoin('DeviceStatus as ds', 'd.deviceStatusId', 'ds.id')
    .innerJoin('DeviceTypeCategory as dc', 'dt.deviceTypeCategoryId', 'dc.id')
    .innerJoin('Site as s', 'd.siteId', 's.id')
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
      knex('Result as r')
        .whereRaw('r.deviceId = d.id')
        .whereBetween('r.endedOn', [last60Day, last30Day])
        .countDistinct('r.id')
        .as('lastMonth'),
      knex('Result as r')
        .whereRaw('r.deviceId = d.id')
        .where('r.endedOn', '>=', last30Day)
        .countDistinct('r.id')
        .as('thisMonth'),
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

      // TODO: Fix this/last month queries so they work for other (non-reporter) devices
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
      knex('Result as r')
        .innerJoin('Sample as s', 'r.sampleId', 's.id')
        .innerJoin(
          'ResultWorkflowStatus as rw',
          'r.resultWorkflowStatusId',
          'rw.id'
        )
        .whereRaw('s.originSiteId = d.siteId')
        .select(
          (() => {
            const acknowledgedCount =
              "sum(case when rw.externalId = 'Acknowledged' then 1 else 0 end)"
            const totalCount = 'count(distinct r.id)'

            return knex.raw(
              `case when count(r.id) = 0 then 0 else ${acknowledgedCount} / ${totalCount} end`
            )
          })()
        )
        .as('acknowledgedRatio'),
      knex('Result as r')
        .innerJoin('Sample as s', 'r.sampleId', 's.id')
        .innerJoin(
          'ResultWorkflowStatus as rw',
          'r.resultWorkflowStatusId',
          'rw.id'
        )
        .whereRaw('s.originSiteId = d.siteId')
        .where('rw.externalId', '=', 'Flagged')
        .countDistinct('r.id')
        .as('totalFlagged'),
    ])

  // return result when both queries are finished
  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  data.forEach(it => {
    // FIXME: Use actual data instead
    it.availability = {
      count: _.random(1, 20),
      total: 20,
    }
    it.error = {
      count: _.random(1, 875),
      total: 875,
    }
    it.alerts = [
      {
        type: 'needs-repair',
      },
      {
        type: 'warranty',
      },
      {
        type: 'quality-control',
      },
      {
        type: 'connectivity',
      },
    ].filter(() => _.random(0, 10) > 7)
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

  const devices = await knex('Device as d')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .innerJoin('DeviceStatus as ds', 'd.deviceStatusId', 'ds.id')
    .innerJoin('DeviceTypeCategory as dc', 'dt.deviceTypeCategoryId', 'dc.id')
    .innerJoin('Site as s', 'd.siteId', 's.id')
    .where('d.id', +params.deviceId)
    .modify(addConstraints, dataConstraints, { device: 'd' })
    .select(fields)

  if (devices.length !== 1) {
    return Boom.notFound()
  }
  const device = devices[0]
  const deviceType = await knex('DeviceType as dt')
    .where('dt.id', device.deviceTypeId)
    .first()
  const deviceLog = await knex('DeviceStatusLog as dl')
    .leftOuterJoin('DeviceStatus as ds', 'dl.deviceStatusId', 'ds.id')
    .leftOuterJoin('User as u', 'dl.createdBy', 'u.id')
    .where('dl.deviceId', device.id)
    .select(
      'ds.name as status',
      'dl.changedOn',
      'dl.createdOn',
      'u.name as changedBy'
    )

  device.statusLogs = deviceLog
  deviceType.configurationDataSchema =
    JSON.parse(deviceType.configurationDataSchema) || {}
  deviceType.deviceOperationSchema =
    JSON.parse(deviceType.deviceOperationSchema) || {}

  device.configurationData = JSON.parse(device.configurationData) || {}
  device.deviceType = deviceType

  // Query for total number of results per device
  const totalTestQuery = knex('Result as r')
    .count('r.id as count')
    .leftJoin('Sample as s', 's.id', 'r.sampleId')

  // If the device is not a reporter
  if (device.siteId == null || device.category !== 'Client') {
    totalTestQuery.where('r.deviceId', device.id)
  } else {
    // TODO: This query would fail if there we had more than one reporter in one site
    totalTestQuery.where(function() {
      this.where('r.deviceId', device.id)
      this.orWhere('s.originSiteId', device.siteId)
    })
  }

  const [{ count: totalTests }] = await totalTestQuery

  device.totalTests = totalTests

  const contacts = await knex('Person as p')
    .select('p.id', 'p.name')
    .limit(50)

  device.contacts = _.times(
    3,
    () => contacts.splice(_.random(0, contacts.length - 1), 1)[0]
  )

  return device
}

async function showDevice(request) {
  const device = await getDeviceByDeviceId(request)

  const {
    data: { device: operations /* FIXME: actual impl */ },
  } = await operationalDashboard(request)

  _.forEach(operations, it => {
    it.message = undefined
  })

  device.operations = _.filter(
    operations,
    it => it.key !== 'modules-unavailable'
  )

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
    ;({ id: deviceStatusId } = await knex('DeviceStatus as ds')
      .where('ds.token', payload.statusToken)
      .first('ds.id'))
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

async function onDeviceMaintenance(
  { deviceId, status, options = {} },
  { messageContext }
) {
  const now = new Date()
  const {
    data: newMaintenanceData = {},
    mergeData = false,
    changedOn = now,
    lastSeenOn = now,
    resolveOn: newResolveOn = null,
  } = options
  return messageContext.transact(async knex => {
    const {
      lastSeenOn: currentLastSeenOn,
      deviceMaintenanceStatusId: currentMaintenanceStatusId,
      deviceMaintenanceData: currentStringData,
      deviceMaintenanceResolveOn: currentResolveOn,
      newMaintenanceStatusId,
    } = await knex('Device as d')
      .join(
        'DeviceMaintenanceStatus as dms',
        'd.deviceMaintenanceStatusId',
        'dms.id'
      )
      .where('d.id', deviceId)
      .first(
        'd.deviceMaintenanceStatusId',
        'd.lastSeenOn',
        'd.deviceMaintenanceData',
        'd.deviceMaintenanceResolveOn',
        knex('DeviceMaintenanceStatus as dmsNew')
          .where('dmsNew.token', status)
          .first('dmsNew.id')
          .as('newMaintenanceStatusId')
      )
    const currentMaintenanceData =
      currentStringData == null ? {} : JSON.parse(currentStringData)
    if (
      newMaintenanceStatusId !== currentMaintenanceStatusId ||
      (lastSeenOn == null || currentLastSeenOn < lastSeenOn) ||
      !_.isEqual(currentResolveOn, newResolveOn) ||
      !_.isEqual(currentMaintenanceData, newMaintenanceData)
    ) {
      const stringData = JSON.stringify(
        !mergeData
          ? newMaintenanceData
          : _.merge(currentMaintenanceData, newMaintenanceData)
      )
      await knex('DeviceMaintenanceStatusLog').insert({
        deviceId,
        deviceMaintenanceStatusId: newMaintenanceStatusId,
        data: stringData,
        changedOn,
        createdOn: now,
      })
      await knex('Device')
        .where({ id: deviceId })
        .update({
          // lastSeenOn: lastSeenOn != null ? currentLastSeenOn : lastSeenOn,
          deviceMaintenanceStatusId: newMaintenanceStatusId,
          deviceMaintenanceData: stringData,
          deviceMaintenanceResolveOn: now, // FIXME newResolveOn,
        })
      const action = deviceMaintenanceStatusAction[status]
      if (action != null) {
        // FIXME device lastSeenOn / common resolveOn ?
        // FIXME device not online if lastSeenOn < ?
        messageContext.dispatch(action(deviceId))
      }
    }
  })
}

module.exports = {
  listDevices,
  showDevice,
  updateDevice,
  listStatusTypes,
  exportDevices,
  listDevicesForSelectList,
  getDevice,
  onDeviceMaintenance,
}
