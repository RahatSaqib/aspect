const Boom = require('@hapi/boom')
const Promise = require('bluebird')
const Stream = require('stream')
const _ = require('lodash')
const { subDays } = require('date-fns')
const { formatInTimeZone } = require('date-fns-tz')
const csv = require('fast-csv')
const { knex } = require('../db')
const { getUser } = require('../auth/service')
const { getReportDetails, listReports } = require('./service')
const {
  exportData,
  getBaseReplacements,
  getMaxLimitPlaceHolders,
  getAdministrativeDivisionLabelPlaceHolders,
  renderExcelTemplate,
  streamExcelTemplate,
  respondFile,
  respondStream,
  RELABEL_EXCEL,
} = require('../shared/excel')
const logger = require('../shared/logger')

/**
 * constants for statuses of report processing
 */
const REPORT_NOT_STARTED = 'REPORT_NOT_STARTED'
const REPORT_PROCESSING = 'REPORT_PROCESSING'
const REPORT_FAILED = 'REPORT_FAILED'
const REPORT_FINISHED = 'REPORT_FINISHED'

// ----------------------------------------------------------------------------------------------
async function getSheetData(request, sheet, sharedResults) {
  const { auth } = request
  const { moduleName, functionName } = sheet
  const { nameOfSharedData, useNamedData } = sheet.query
  const sheetQuery = _.omit(sheet.query, ['nameOfSharedData', 'useNamedData'])
  const query = {
    // filters defined on Reports page
    ...request.query,
    // make sure to report all results (up to 1 million records)
    page: 0,
    size: 999999,
    // specific params for endpoint from ReportSheet table, i.e. sortCol, sortDir
    ...sheetQuery,
  }

  if (!moduleName || !functionName) {
    return Boom.preconditionFailed(
      `Both moduleName ('${moduleName}') and functionName ('${functionName}') are required`
    )
  }

  let endpointModule
  try {
    endpointModule = require(`../${moduleName}`) //eslint-disable-line
  } catch (error) {
    return Boom.preconditionFailed(`Can not load module ${moduleName}: ${error.toString()}`)
  }

  const dataFunc = endpointModule[functionName]
  if (!dataFunc) {
    return Boom.preconditionFailed(`Can not find function ${functionName} in module ${moduleName}`)
  }

  logger.debug(`Report moduleName='${moduleName}', functionName='${functionName}'`, RELABEL_EXCEL)

  const result = await dataFunc(auth, query, { sharedResults, useNamedData })
  const {
    ok,
    data,
    total,
    errorMessage,
    dynamicColumns = [],
    fixedColumns = [],
    dataSelector = null,
    sections = [],
  } = result

  if (nameOfSharedData) {
    sharedResults[nameOfSharedData] = result
  }

  const listSize = _.isPlainObject(data) ? data?.rows?.length : data?.length
  logger.debug(`Worksheet data - total=${total}, list size=${listSize}'`, RELABEL_EXCEL)

  if (ok) {
    return { data, total, dynamicColumns, fixedColumns, dataSelector, sections }
  }

  return Boom.preconditionFailed(`Error in function ${functionName} of module ${moduleName} - ${errorMessage}`)
}

// ----------------------------------------------------------------------------------------------
function getDateRangeString({ minDate, maxDate, timeZone = 'America/New_York' }) {
  const dateFormat = 'dd-MM-yyyy'
  if (!minDate && !maxDate) {
    return 'all'
  }
  const dates = []
  if (minDate) {
    dates.push(minDate ? formatInTimeZone(new Date(minDate), timeZone, dateFormat) : '')
  }
  dates.push(' — ') // long dash
  if (maxDate) {
    dates.push(maxDate ? formatInTimeZone(new Date(maxDate), timeZone, dateFormat) : '')
  }
  return dates.join('')
}

// ----------------------------------------------------------------------------------------------
async function getStateNames({ countryId, stateId }) {
  if (!countryId || !stateId) {
    return 'all'
  }
  const { name } = await knex('Geography as g')
    .leftOuterJoin('State as st', 'g.stateId', 'st.id')
    .leftOuterJoin('Lga as l', 'g.lgaId', 'l.id')
    .where('g.countryId', countryId)
    .where('st.id', stateId)
    .first('st.name')
  return name
}

// ----------------------------------------------------------------------------------------------
async function getLgaNamesString({ countryId, stateId, lgaId }) {
  if (!countryId || !stateId) {
    return 'all'
  }
  const items = await knex('Geography as g')
    .leftOuterJoin('State as st', 'g.stateId', 'st.id')
    .leftOuterJoin('Lga as l', 'g.lgaId', 'l.id')
    .where('g.countryId', countryId)
    .where('st.id', stateId)
    .whereNotNull('g.lgaId')
    .where(builder => {
      if (lgaId) {
        builder.where('l.id', lgaId)
      }
    })
    .orderBy('l.name')
    .select('l.name')
  return items.map(x => x.name).join(', ')
}

async function getAllSheetsData(request, sheets) {
  let boomError
  const dataSet = []
  const sharedResults = {}
  // process all sheets
  await Promise.each(sheets, async (sheet, sheetIndex) => {
    if (!sheet || boomError) return

    // get data for this sheet
    const {
      data,
      dynamicColumns,
      fixedColumns,
      total = null,
      dataSelector = null,
      sections,
    } = await getSheetData(request, sheet, sharedResults)
    if (Boom.isBoom(data)) {
      boomError = data
      return
    }

    dataSet[sheetIndex] = {
      data,
      dynamicColumns,
      fixedColumns,
      sections,
      dataSelector,
      total,
      // TODO: use i18n string, because `createReport()` uses locale file templates with all labels translated
      defaultNoDataMessage: 'No data',
    }
  })

  if (boomError) {
    return boomError
  }
  return dataSet
}

// ----------------------------------------------------------------------------------------------
async function createReport(request, reply) {
  const { auth, query, params } = request
  const { externalId, templateFolderPath } = params
  const { sheets, fileName, exportExcel } = await getReportDetails(auth, externalId)
  const user = await getUser(auth.credentials.name)
  const { countryAbbreviation, culture, partnerId, userName } = user
  const email = user.email || '-'
  const cell = user.cell || '-'

  // default to `xlsx`, notice that query validation allows only 'xlsx', 'csv', or empty/no param
  const extension = (query.format && query.format === 'csv') || !exportExcel ? 'csv' : 'xlsx'

  if (_.isNil(query.minDate)) {
    query.minDate = subDays(new Date(query.maxDate), 30).toISOString()
  }

  const data = await getAllSheetsData(request, sheets)
  if (Boom.isBoom(data)) {
    throw data
  }

  const administrativeDivisionLabelPlaceHolders = await getAdministrativeDivisionLabelPlaceHolders({
    partnerId,
  })

  const replacements = [
    {
      placeholder: '<Dates>',
      value: getDateRangeString(query),
    },
    {
      placeholder: '<States>',
      value: await getStateNames(query),
    },
    {
      placeholder: '<Lgas>',
      value: await getLgaNamesString(query),
    },
    {
      placeholder: '<Sites>',
      value: query.siteName ?? 'all',
    },
    {
      placeholder: '<UserEmail>',
      value: email,
    },
    {
      placeholder: '<UserMobilePhone>',
      value: cell,
    },
    {
      placeholder: '<UserFullName>',
      value: userName,
    },
    ...getMaxLimitPlaceHolders(),
    ...administrativeDivisionLabelPlaceHolders,
  ]

  if (extension === 'csv') {
    return streamToCsv(data, reply, fileName)
  }
  const renderParams = {
    countryAbbreviation,
    culture,
    templateFolderPath,
    externalId,
    data,
    replacements,
    extension,
    fileName,
    reply,
  }
  // Response entire file if template has formats and formulae.
  if (_.some(sheets, s => s.query.avoidStreaming)) {
    return renderExcelFile(renderParams)
  }
  // Stream the response unless report has formats or formulae.
  return renderExcelStream(renderParams)
}

async function renderExcelFile(params) {
  const {
    countryAbbreviation,
    culture,
    templateFolderPath,
    externalId,
    data,
    replacements,
    extension,
    fileName,
    reply,
  } = params

  const dataBuffer = await renderExcelTemplate({
    countryAbbreviation,
    culture,
    templateFolderPath: templateFolderPath || externalId,
    data,
    extension,
    replacements,
  })

  return respondFile({
    dataBuffer,
    extension,
    fileNamePrefix: fileName,
    reply,
  })
}

async function streamToCsv(dataset, reply, fileName) {
  const worksheetData = dataset[0]

  const { data = [], defaultNoDataMessage, dataSelector, fixedColumns = [], dynamicColumns = [] } = worksheetData || {}
  /**
   * replace base placeholders, i.e. <Dates>, <States>, etc in the header
   */
  const csvStream = csv.format({
    headers: data.length > 0,
    writeBOM: true,
  })

  if (data.length > 0) {
    _.forEach(data, row => {
      const rowNormalized = transformRow(row, [...fixedColumns, ...dynamicColumns], dataSelector)
      csvStream.write(rowNormalized)
    })
  } else {
    csvStream.write({ data: defaultNoDataMessage })
  }
  csvStream.end()
  return reply
    .response(csvStream)
    .encoding('binary')
    .type('stream/octet-stream')
    .header('content-disposition', `attachment; filename=${fileName}-${new Date().toISOString()}.csv;`)
}

function transformRow(row, columns, dataSelector) {
  const rowNormalized = {}
  const value = dataSelector ? dataSelector(row) : row
  columns.forEach(({ key, header }) => (rowNormalized[header] = value[key]))

  return rowNormalized
}

function renderExcelStream(params) {
  const stream = new Stream.PassThrough()
  const {
    countryAbbreviation,
    culture,
    templateFolderPath,
    externalId,
    data,
    replacements,
    extension,
    fileName,
    reply,
  } = params
  /**
   * process in another thread with `setInterval`
   */
  let status = REPORT_NOT_STARTED
  const intervalId = setInterval(() => {
    if (status === REPORT_NOT_STARTED) {
      status = REPORT_PROCESSING
      // call async func in chaining mode - with then/catch
      streamExcelTemplate({
        stream,
        culture,
        countryAbbreviation,
        templateFolderPath: templateFolderPath || externalId,
        data,
        replacements,
      })
        .then(workbook => {
          status = REPORT_FINISHED
          /**
           * All data written, now the very last step is to commit workbook.
           * Notice that `commit()` in `workbook` is async func, but we run it
           * without `await` to not delay/block thread to let clear interval
           */
          workbook.commit()
        })
        .catch(ex => {
          status = REPORT_FAILED
          logger.error(ex, RELABEL_EXCEL)

          /**
           * when stream is destroyed with specifying error object
           * (see https://nodejs.org/api/stream.html#writabledestroyerror for details),
           * then in UI a `catch` block triggers (yes, for Status Code 200) of the download
           * request because responded blob contains rejected Promise
           */
          stream.destroy(ex)
        })
    }
    if (status === REPORT_FINISHED || status === REPORT_FAILED) {
      clearInterval(intervalId)
    }
  }, 1000)

  return respondStream({
    stream,
    extension,
    fileNamePrefix: fileName,
    reply,
  })
}

// ----------------------------------------------------------------------------------------------
async function exportReports(request, reply) {
  const { data } = await listReports(request)
  const sheetData = {
    data,
    // TODO: use i18n string, because `exportData()` uses locale file templates with all labels translated
    defaultNoDataMessage: 'No data',
  }
  return exportData(request, reply, sheetData, 'reports', {
    replacements: [...getBaseReplacements(), ...getMaxLimitPlaceHolders()],
  })
}
module.exports = {
  createReport,
  exportReports,
}
