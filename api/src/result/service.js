const Boom = require('boom')
const _ = require('lodash')
const dateFormat = require('date-fns/format')
const subDays = require('date-fns/sub_days')
const startOfMonth = require('date-fns/start_of_month')
const endOfMonth = require('date-fns/end_of_month')
const subMonths = require('date-fns/sub_months')
const startOfQuarter = require('date-fns/start_of_quarter')
const endOfQuarter = require('date-fns/end_of_quarter')
const subQuarters = require('date-fns/sub_quarters')
const startOfYear = require('date-fns/start_of_year')

const {
  knex,
  filterParams,
  filterDateRangeParams,
  sortPageParams,
} = require('../db')
const { resultUpdated } = require('./actions')
const { getConstraints, addConstraints } = require('../auth/constraints')
const { getUser } = require('../auth/service')
const {
  getCellsByValue,
  generateExcelFile,
  generateCsvFile,
} = require('../shared/io')
const { oneDirectionalMd5Hash } = require('../shared/encryption')
const {
  resultModuleTemperatureError,
  resultModulePowerError,
  resultModuleFailureError,
  resultDataCategoryLow,
} = require('../result/actions')

const MODULE_TEMPERATURE_ERROR_CODES = [
  '1001',
  '1004',
  '1017',
  '2014',
  '2022',
  '4009',
  '4010',
]
const MODULE_POWER_ERROR_CODES = [
  '1007',
  '2122',
  '2123',
  '2124',
  '2126',
  '2127',
  '4008',
]

const MODULE_FAILURE_ERROR_CODES = [
  '1002',
  '1005',
  '1006',
  '1018',
  '2011',
  '2012',
  '2016',
  '2017',
  '2018',
  '2021',
  '2023',
  '2024',
  '2026',
  '2032',
  '2034',
  '2035',
  '3000',
  '4001',
  '4002',
  '4003',
  '4004',
  '4006',
  '4011',
  '4012',
  '4013',
  '4014',
  '4015',
  '4016',
  '4017',
  '4019',
  '5013',
  '5014',
  '5015',
  '5016',
]

const moduleTemperatureMaxErrors = 4
const modulePowerMaxErrors = 4
const moduleFailureMaxErrors = 2
const SELECT_LIST_FIELDS = [
  'r.id',
  'r.externalId',
  'r.endedOn',
  'd.name as deviceName',
  'c.name as countryName',
  'st.name as stateName',
  'lg.name as lgaName',
  'rc1.name as resultCategory1Name',
  'rc2.name as resultCategory2Name',
  'rs.name as resultWorkflowStatus',
  'so.name as sampleOriginSiteName',
  'sp.externalId as sampleId',
  'r.sampleGroup',
  'sp.collectedOn as sampleCollectedOn',
  'a.name as assayName',
  'a.id as assayId',
  'r.deviceId',
  'stp.name as sampleTypeName',
  knex.raw(
    'JSON_UNQUOTE(JSON_EXTRACT(r.resultData, "$.resultText")) as resultText'
  ),
  knex.raw('JSON_UNQUOTE(JSON_EXTRACT(r.patientData, "$.id")) as patientId'),
]

const SELECT_SHOW_FIELDS = [
  'r.id',
  'r.externalId',
  'r.startedOn',
  'r.endedOn',
  'r.deviceId',
  'd.name as deviceName',
  'c.name as countryName',
  'st.name as stateName',
  'lg.name as lgaName',
  'rc1.name as resultCategory1Name',
  'rc2.name as resultCategory2Name',
  'r.resultWorkflowStatusId',
  'rs.name as resultWorkflowStatus',
  'rs.externalId as resultWorkflowStatusExternalId',
  'r.resultData',
  'r.siteId',
  'si.name as siteName',
  'r.assayVersion',
  'r.consumableSerial',
  'r.consumableLot',
  'r.consumableExpirationDate',
  'r.instrumentSerial',
  'r.moduleName',
  'r.moduleSerial',
  'r.researchId',
  'r.senderVersion',
  'r.senderOperator',
  'r.notes',
  'r.errorCode',
  'r.errorNotes',
  'r.createdOn',
  'r.updatedOn',
  'r.assayId',
  'sp.externalId as sampleId',
  'r.sampleGroup',
  'sp.originSiteId as sampleOriginSiteId',
  'sp.collectedOn as sampleCollectedOn',
  'so.name as sampleOriginSiteName',
  'stp.name as sampleTypeName',
  knex.raw('JSON_UNQUOTE(JSON_EXTRACT(r.patientData, "$.id")) as patientId'),
  'r.patientData',
  'r.qcCheck',
]

const SORT_FIELDS = [
  'endedOn',
  'deviceName',
  'sampleOriginSiteName',
  'stateName',
  'lgaName',
  'sampleId',
  'sampleGroup',
  'resultText',
  'resultWorkflowStatus',
  'resultCategory1Name',
  'resultCategory2Name',
  'patientId',
]
async function getListResults(query, auth) {
  const selectFields = _.clone(SELECT_LIST_FIELDS)
  const sortableFields = _.clone(SORT_FIELDS)

  const assayColumns = []
  if (query.assayId) {
    const assay = await knex('Assay as a')
      .where('a.id', query.assayId)
      .first()

    if (assay.resultCategory1Label) {
      selectFields.push('rc1.name as resultCategory1Name')
      sortableFields.push('resultCategory1Name')
      assayColumns.push({
        db: 'resultCategory1Name',
        type: 'string',
        title: assay.resultCategory1Label,
        i18nKey: assay.resultCategory1i18nKey,
      })
    }

    if (assay.resultCategory2Label) {
      selectFields.push('rc2.name as resultCategory2Name')
      sortableFields.push('resultCategory2Name')
      assayColumns.push({
        db: 'resultCategory2Name',
        type: 'string',
        title: assay.resultCategory2Label,
        i18nKey: assay.resultCategory2i18nKey,
      })
    }

    const resultDataSchema = JSON.parse(assay.resultDataSchema)
    _.each(resultDataSchema, (value, key) => {
      if (value.list) {
        selectFields.push(
          knex.raw('JSON_EXTRACT(resultData, ?) as ?', [
            `$.${key}`,
            key.replace('.', '_'),
          ])
        )

        sortableFields.push(key.replace('.', '_'))

        assayColumns.push({
          db: key.replace('.', '_'),
          type: value.type,
          title: value.title,
          i18nKey: value.i18nKey,
        })
      }
    })
  }

  // now we know if the sort that was passed is valid:
  if (query.sortCol && !sortableFields.includes(query.sortCol)) {
    return Boom.badRequest()
  }

  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)

  const resultQuery = knex('Result as r')
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .leftJoin('Geography as g', 'r.geographyId', 'g.id')
    .leftJoin('Country as c', 'g.countryId', 'c.id')
    .leftJoin('State as st', 'g.stateId', 'st.id')
    .leftJoin('Lga as lg', 'g.lgaId', 'lg.id')
    .leftJoin('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
    .leftJoin('ResultCategory as rc2', 'r.resultCategory2', 'rc2.id')
    .leftJoin('Sample as sp', 'r.sampleId', 'sp.id')
    .leftJoin('SampleType as stp', 'sp.sampleTypeId', 'stp.id')
    .leftJoin('Site as so', 'sp.originSiteId', 'so.id')
    .leftJoin('ResultWorkflowStatus as rs', 'r.resultWorkflowStatusId', 'rs.id')
    .leftJoin('ResultSource as rsrc', 'r.resultSourceId', 'rsrc.id')
    .leftJoin('Site as sr', 'r.siteId', 'sr.id')
    // Filter Generated results for now until we come up with appropriate UI
    .where('rsrc.externalId', '<>', 'Generated')
    .modify(filterDateRangeParams, query, 'r.endedOn')
    .modify(filterParams, query, {
      deviceId: 'd.id',
      assayId: 'r.assayId',
      resultCategoryId: 'r.resultCategory1',
      countryId: 'g.countryId',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      deviceName: 'd.name',
      siteName: 'sr.name',
      sampleId: 'sp.externalId',
      sampleOriginSite: 'so.name',
      sampleGroup: 'r.sampleGroup',
      workflowStatusId: 'r.resultWorkflowStatusId',
    })
    .modify((queryBuilder, params) => {
      if (params.patientOrResearchId) {
        queryBuilder
          .whereRaw('JSON_EXTRACT(r.patientData, "$.id") like ?', [
            `%${params.patientOrResearchId}%`,
          ])
          .orWhere('r.researchId', 'like', `%${params.patientOrResearchId}%`)
      }
    }, query)
    .modify(addConstraints, dataConstraints, { device: 'd', sample: 's' })

  // get total count for paging
  const getCount = resultQuery
    .clone()
    .count('r.id as count')
    .first()

  // get rows
  const getItems = resultQuery
    .clone()
    .modify(sortPageParams, query, 'endedOn')
    .select(selectFields)

  // return result when both queries are finished
  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  // if assay specified columns from the resultData field, parse them to valid JSON
  if (assayColumns) {
    _.each(data, d => {
      _.each(assayColumns, c => {
        if (c && c.db.indexOf('resultCategory') === -1) {
          const path = c.db.replace('.', '_')
          _.set(d, path, JSON.parse(d[path]))
        }
      })
    })
  }

  const result = {
    ok: true,
    total,
    length: data.length,
    data,
    extraColumns: assayColumns,
  }

  return result
}

async function listResults(request) {
  const { query, auth } = request
  const result = await getListResults(query, auth)
  return result
}

async function showResult(request) {
  const result = await getResultByResultId(request)
  return result.ok ? result : Boom.notFound()
}

async function showDeviceLogs(request) {
  const result = await getDeviceLogsByResultId(request)
  return result
}

async function getDeviceLogsByResultId(request) {
  const { params, auth } = request
  const dataConstraints = await getConstraints(auth.credentials)
  const deviceLogs = await knex('DeviceLog as dl')
    .innerJoin('Device as d', 'dl.deviceId', 'd.id')
    .where('dl.resultId', params.resultId)
    .orderBy('createdOn', 'desc')
    .modify(addConstraints, dataConstraints, { device: 'd' })
    .select(
      'dl.createdOn',
      'dl.checkpoint as checkPoint',
      'dl.deviceOperationId',
      'dl.source',
      'dl.deviceConfigurationUpdated',
      'dl.senderIp',
      'dl.rawMessage'
    )
    .limit(50)
  return { data: deviceLogs }
}

async function getResultByResultId(request, fields = SELECT_SHOW_FIELDS) {
  const { auth, params } = request
  const dataConstraints = await getConstraints(auth.credentials)

  const results = await knex('Result as r')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .leftJoin('Geography as g', 'r.geographyId', 'g.id')
    .leftJoin('Site as si', 'r.siteId', 'si.id')
    .leftJoin('Country as c', 'g.countryId', 'c.id')
    .leftJoin('State as st', 'g.stateId', 'st.id')
    .leftJoin('Lga as lg', 'g.lgaId', 'lg.id')
    .leftJoin('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
    .leftJoin('ResultCategory as rc2', 'r.resultCategory2', 'rc2.id')
    .leftJoin('Sample as sp', 'r.sampleId', 'sp.id')
    .leftJoin('SampleType as stp', 'sp.sampleTypeId', 'stp.id')
    .leftJoin('Site as so', 'sp.originSiteId', 'so.id')
    .leftJoin('ResultWorkflowStatus as rs', 'r.resultWorkflowStatusId', 'rs.id')
    .where('r.id', +params.resultId)
    .modify(addConstraints, dataConstraints, { device: 'd' })
    .select(fields)

  let data = null

  // translate result data back to an object and get assay details
  // if selecting the result was successful
  if (results.length === 1) {
    ;[data] = results
    data.resultData = JSON.parse(data.resultData)
    data.patientData = JSON.parse(data.patientData)

    data.assay = await knex('Assay as a')
      .where('a.id', data.assayId)
      .first()

    data.assay.resultDataSchema = JSON.parse(data.assay.resultDataSchema)
    data.assay.patientDataSchema = JSON.parse(data.assay.patientDataSchema)
  }

  return { ok: results.length === 1, data }
}

async function listResultTypes(request) {
  const { query } = request

  const resultTypeQuery = knex('ResultType as rt').modify(filterParams, query, {
    name: 'rt.name',
  })

  // get total count for paging
  const getCount = resultTypeQuery
    .clone()
    .count('rt.id as count')
    .first()

  // get rows
  const getItems = resultTypeQuery
    .clone()
    .modify(sortPageParams, query, 'name')
    .select('id', 'name')

  // return result when both queries are finished
  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  const result = { ok: true, total, length: data.length, data }

  return result
}

// ---------------------------------
// exporting Results data
// ---------------------------------
async function exportResults(request) {
  const { query, auth } = request

  // ---------------
  // change query page/size values to get whole dataset (not only currently paged items)
  query.page = 0
  // do not export more than 100.000 records
  query.size = 1e5

  // get whole dataset - based on current query params (sorting, filtering) and auth constraints
  const results = await getListResults(query, auth)

  let result = null

  if (query.format === 'excel') {
    // fill in data into given workbook
    const populateData = workbook => {
      // get 1st sheet (1-based)
      const worksheet = workbook.getWorksheet(1)

      // locate cell(s) with needed value
      const cells = getCellsByValue(worksheet, '<ResultListRows>')
      if (cells.length > 0) {
        // empty such cells
        cells.forEach(cell => {
          cell.value = ''
        })

        // use 1st cell only (actually, should not be more than one)
        const patternRowNumber = cells[0].row + 2

        // fill in array 'rows'
        const rows = []
        results.data.forEach(r => {
          // ------
          // --->>> order of array elements should match columns order in template file
          // ------
          rows.push([
            r.endedOn,
            r.deviceName,
            r.sampleOriginSiteName,
            r.sampleId,
            r.sampleGroup,
            r.patientId,
          ])
        })

        // insert rows from patternRowNumber, and remove row number 'patternRowNumber'
        worksheet.spliceRows(patternRowNumber, 1, ...rows)
      }
    }

    result = await generateExcelFile({
      templateFileName: 'Results.xlsx',
      outputFileName: 'results.xlsx',
      populateData,
    })
  } else if (query.format === 'csv') {
    const items = results.data
    const columnNames = [
      'Test Date',
      'Device',
      'Sample Origin Site',
      'Sample ID',
      'Sample Group',
      'Patient ID',
    ]
    const fieldNames = [
      'endedOn',
      'deviceName',
      'sampleOriginSiteName',
      'sampleId',
      'sampleGroup',
      'patientId',
    ]
    result = await generateCsvFile(
      'results.csv',
      items,
      columnNames,
      fieldNames
    )
  }

  return result
}

async function updateWorkflowStatus(request) {
  const { auth, params, payload } = request
  const now = new Date()
  const { resultId } = params
  const { id: currentUserId } = await getUser(auth.credentials.name)

  // get the result so we can check access and if status changed
  const result = await getResultByResultId(request)
  if (!result.ok) {
    Boom.notFound()
  }

  let { resultWorkflowStatusId } = payload
  // check if a externalId is provided
  if (payload.externalId) {
    ;[resultWorkflowStatusId] = await knex('ResultWorkflowStatus as rs')
      .where('rs.externalId', payload.externalId)
      .select('rs.id')
      .limit(1)
      .map(row => row.id)

    if (!resultWorkflowStatusId) {
      return Boom.badRequest('Invalid ResultWorkflowStatus ID')
    }
  }

  // update the resultWorkflowStatusId.
  if (resultWorkflowStatusId !== result.data.resultWorkflowStatusId) {
    await knex('Result')
      .where('id', resultId)
      .update({
        resultWorkflowStatusId,
        updatedBy: currentUserId,
        updatedOn: now,
      })

    await knex('ResultWorkflowLog').insert({
      resultId,
      resultWorkflowStatusId,
      createdBy: currentUserId,
      changedOn: now,
      createdOn: now,
    })
  }

  const response = await showResult(request)
  return response
}

async function updateQcCheck(request) {
  const { auth, params, payload, plugins: { messageContext } } = request
  const now = new Date()
  const { resultId } = params
  const { id: currentUserId } = await getUser(auth.credentials.name)

  // get the result so we can check access and workflow status
  const result = await getResultByResultId(request)
  if (!result.ok) {
    return Boom.notFound()
  }

  if (result.data.resultWorkflowStatusExternalId !== 'Deliverable') {
    return Boom.badRequest(
      '"QC Check" can only be set for results that are in the workflow status "Ready for Delivery".'
    )
  }

  // update the result QC Check flag
  messageContext.bindActionCreators({
    resultUpdated,
  })
  await messageContext.transact(async knex => {
    await knex('Result')
      .where('id', resultId)
      .update({
        qcCheck: payload.qcCheck,
        updatedBy: currentUserId,
        updatedOn: now,
      })

    // log QC-Check change in separate table
    await knex('ResultQualityControlLog').insert({
      resultId,
      qcCheck: payload.qcCheck,
      createdBy: currentUserId,
      createdOn: now,
    })

    // notify result updated so result is redelivered
    messageContext.resultUpdated(resultId)
  })

  const response = await showResult(request)
  return response
}

async function listWorkflowStatusTypes() {
  const resultQuery = knex('ResultWorkflowStatus as rs')

  // get total count for paging
  const getCount = resultQuery
    .clone()
    .count('rs.id as count')
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

async function listWorkflowStatusLog(request) {
  const result = await getWorkflowStatusLogByResultId(request)
  return result.ok ? result : Boom.notFound()
}

async function getWorkflowStatusLogByResultId(request) {
  const { query, params } = request

  const selectFields = [
    'log.id',
    'log.operator',
    'log.changedOn',
    'log.createdOn',
    'log.createdBy',
    'rs.name as statusName',
    'rs.i18nKey',
    'rs.externalId',
  ]
  const sortableFields = ['operator', 'changedOn', 'statusName']

  // now we know if the sort that was passed is valid:
  if (query.sortCol && !sortableFields.includes(query.sortCol)) {
    return Boom.badRequest()
  }

  const resultQuery = knex('ResultWorkflowLog as log')
    .innerJoin(
      'ResultWorkflowStatus as rs',
      'log.resultWorkflowStatusId',
      'rs.id'
    )
    .where('log.resultId', +params.resultId)

  // get total count for paging
  const getCount = resultQuery
    .clone()
    .count('log.id as count')
    .first()

  // get rows
  const getItems = resultQuery
    .clone()
    .modify(sortPageParams, query, 'changedOn')
    .select(selectFields)

  // return result when both queries are finished
  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  const result = { ok: true, total, length: data.length, data }

  return result
}

function createUniqueIdForResult(
  instrumentSerial,
  testStartedOn,
  testEndedOn,
  sampleId
) {
  if (!instrumentSerial || !testStartedOn || !testEndedOn || !sampleId) {
    return null
  }
  const hashedSampleId = oneDirectionalMd5Hash(sampleId)
  const uniqueId = `${instrumentSerial}_${dateFormat(
    testStartedOn,
    'mmss'
  ).substr(1)}${dateFormat(testEndedOn, 'mmss').substr(
    1
  )}_${hashedSampleId.substr(0, 8)}`
  return uniqueId
}

// check for error codes when a result is logged
async function onResultLogged({ resultId }, { messageContext }) {
  const context = messageContext.bindActionCreators({
    resultModuleTemperatureError,
    resultModulePowerError,
    resultModuleFailureError,
  })
  await context.run(async knex => {
    const [result] = await knex('Result as r').where('r.id', resultId)
    if (result.errorCode) {
      const { deviceId } = result
      const last30day = subDays(new Date(), 30)
      const deviceErrorQuery = knex('Result as r')
        .innerJoin('ResultCategory as rc', 'r.resultCategory1', 'rc.id')
        .where('rc.externalId', 'Error')
        .where('r.deviceId', deviceId)
      if (MODULE_TEMPERATURE_ERROR_CODES.includes(result.errorCode)) {
        const errorCounts = await deviceErrorQuery
          .clone()
          .where('r.endedOn', '>=', last30day)
          .whereIn('r.errorCode', MODULE_TEMPERATURE_ERROR_CODES)
          .count('r.id as errorCount')
          .groupBy('r.moduleSerial')
        _.forEach(errorCounts, count => {
          if (count.errorCount > moduleTemperatureMaxErrors) {
            context.resultModuleTemperatureError(deviceId)
          }
        })
      } else if (MODULE_POWER_ERROR_CODES.includes(result.errorCode)) {
        const errorCounts = await deviceErrorQuery
          .clone()
          .where('r.endedOn', '>=', last30day)
          .whereIn('r.errorCode', MODULE_POWER_ERROR_CODES)
          .count('r.id as errorCount')
          .groupBy('r.moduleSerial')
        _.forEach(errorCounts, count => {
          if (count.errorCount > modulePowerMaxErrors) {
            context.resultModulePowerError(deviceId)
          }
        })
      } else if (MODULE_FAILURE_ERROR_CODES.includes(result.errorCode)) {
        const errorCounts = await deviceErrorQuery
          .clone()
          .where('r.endedOn', '>=', last30day)
          .whereIn('r.errorCode', MODULE_FAILURE_ERROR_CODES)
          .count('r.id as errorCount')
          .groupBy('r.moduleSerial')
        _.forEach(errorCounts, count => {
          if (count.errorCount > moduleFailureMaxErrors) {
            context.resultModuleFailureError(deviceId)
          }
        })
      }
    }
  })
}

async function checkDataCategoriesForLowStatus(action, { messageContext }) {
  const context = messageContext.bindActionCreators({
    resultDataCategoryLow,
  })

  const now = new Date()
  const addPeriod = (name, dateFrom, dateTo) => ({ name, dateFrom, dateTo })
  const periods = [
    addPeriod('Current Month', startOfMonth(now), now),
    addPeriod(
      'Last Month',
      startOfMonth(subMonths(now, 1)),
      endOfMonth(subMonths(now, 1))
    ),
    addPeriod('Current Quarter', startOfQuarter(now), now),
    addPeriod(
      'Last Quarter',
      startOfQuarter(subQuarters(now, 1)),
      endOfQuarter(subQuarters(now, 1))
    ),
    addPeriod('This Year', startOfYear(now), now),
  ]

  await context.run(async knex => {
    // read all data categories for all geagraphies
    const dataCategories = await knex('DataCategory')

    // check data categories for having 'low status'
    _.map(dataCategories, async dataCategory => {
      const validValues =
        dataCategory.validValues && JSON.parse(dataCategory.validValues)

      // get top geography for this data category
      const { geographyId } = dataCategory
      const geo = await knex('Geography')
        .where('id', geographyId)
        .first()

      // get all sites below top geography
      const sites = await knex('Site as s')
        .innerJoin('Geography as g', 's.geographyId', 'g.id')
        .where(() => {
          // by default top level scope for each DataCategory is country
          this.where('g.countryId', geo.countryId)
          // but if stateId is defined - then fetch all sites from this state only
          if (geo.stateId) {
            this.andWhere('g.stateId', geo.stateId)
          }
          // and if lgaId is defined - then narrow further to only sites from this lga
          if (geo.lgaId) {
            this.andWhere('g.lgaId', geo.lgaId)
          }
        })
        .select('s.id', 's.name', 's.geographyId')

      _.map(periods, period => {
        _.map(sites, site => {
          const itemsBase = knex('Result as r')
            .innerJoin('Device as d', 'r.deviceId', 'd.id')
            // filter by period
            .where('r.endedOn', '>=', period.dateFrom)
            .where('r.endedOn', '<=', period.dateTo)
            // filter by site
            .where(() => {
              // either result is from site's geography
              this.where(() => {
                this.whereNotNull('r.geographyId').andWhere(
                  'r.geographyId',
                  site.geographyId
                )
              })
              // or device is from site's geography
              this.orWhere(() => {
                this.whereNotNull('d.geographyId').andWhere(
                  'd.geographyId',
                  site.geographyId
                )
              })
            })

          const totals = itemsBase.countDistinct('r.id')
          // -------------------------------
          // notice that because patientData is a stringified JSON - all property names and values are quoted, and
          // value has leading space, so pattern is "name": "value"
          // (clarify if it makes sense to distinguish values as string, boolean, date and number here)
          // -------------------------------
          const numValid = itemsBase
            .andWhere(() => {
              // at least make sure field exists in json
              this.where(
                'r.patientData',
                'like',
                `%"${dataCategory.externalId}":%`
              )

              // process 2 main cases - validValues is an array or not
              if (validValues && _.isArray(validValues)) {
                this.where(() => {
                  _.each(validValues, value => {
                    this.orWhere(
                      'r.patientData',
                      'like',
                      `%"${dataCategory.externalId}": "${value}"%`
                    )
                  })
                })
              } else {
                // make sure existing value is not undefined, null, "undefined", "null" or ""
                this.whereNot(
                  'r.patientData',
                  'like',
                  `%"${dataCategory.externalId}": undefined%`
                )
                this.whereNot(
                  'r.patientData',
                  'like',
                  `%"${dataCategory.externalId}": null%`
                )
                this.whereNot(
                  'r.patientData',
                  'like',
                  `%"${dataCategory.externalId}": "undefined"%`
                )
                this.whereNot(
                  'r.patientData',
                  'like',
                  `%"${dataCategory.externalId}": "null"%`
                )
                this.whereNot(
                  'r.patientData',
                  'like',
                  `%"${dataCategory.externalId}": ""%`
                )
              }
            })
            .countDistinct('r.id')

          const percentage = totals === 0 ? 0 : 100 * (numValid / totals)
          if (percentage < dataCategory.cutoffPercentage) {
            const payload = {
              dataCategoryId: dataCategory.id,
              periodName: period.name,
              siteId: site.id,
              percentage,
            }
            context.resultDataCategoryLow(payload)
          }
        })
      })
    })
  })
}

module.exports = {
  listResults,
  showResult,
  listResultTypes,
  updateWorkflowStatus,
  updateQcCheck,
  listWorkflowStatusTypes,
  listWorkflowStatusLog,
  exportResults,
  showDeviceLogs,
  createUniqueIdForResult,
  onResultLogged,
  checkDataCategoriesForLowStatus,
}
