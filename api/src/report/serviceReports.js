const Boom = require('@hapi/boom')
const Promise = require('bluebird')
const Stream = require('stream')
const _ = require('lodash')
const { format } = require('date-fns')
const csv = require('fast-csv')
const { knex, filterParams } = require('../db')
const {
  getMaxLimitPlaceHolders,
  getAdministrativeDivisionLabelPlaceHolders,
  renderExcelTemplate,
  streamExcelTemplate,
  RELABEL_EXCEL,
  renderExcelTemplateToCsv,
} = require('../shared/excel')
const logger = require('../shared/logger')
const { getReportDetails } = require('./service')

/**
 * constants for statuses of report processing
 */
const REPORT_NOT_STARTED = 'REPORT_NOT_STARTED'
const REPORT_PROCESSING = 'REPORT_PROCESSING'
const REPORT_FAILED = 'REPORT_FAILED'
const REPORT_FINISHED = 'REPORT_FINISHED'

// ----------------------------------------------------------------------------------------------
async function getSheetData(auth, queryParams, timezone, sheet, sharedResults) {
  const { moduleName, functionName } = sheet
  const { nameOfSharedData, useNamedData } = sheet.query
  const sheetQuery = _.omit(sheet.query, ['nameOfSharedData', 'useNamedData'])
  const query = {
    // filters defined on Reports page or from a scheduled report based notification
    ...queryParams,
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
    throw Boom.preconditionFailed(`Can not load module ${moduleName}: ${error.toString()}`)
  }

  const dataFunc = endpointModule[functionName]
  if (!dataFunc) {
    return Boom.preconditionFailed(`Can not find function ${functionName} in module ${moduleName}`)
  }

  logger.debug(`Report moduleName='${moduleName}', functionName='${functionName}'`, RELABEL_EXCEL)

  const result = await dataFunc(auth, query, timezone, { sharedResults, useNamedData, nameOfSharedData })
  const {
    ok,
    data,
    total,
    errorMessage,
    dynamicColumns = [],
    fixedColumns = [],
    dataSelector = null,
    sections = [],
    populator,
    replacements,
    alreadyCachedSharedData = false,
  } = result

  if (nameOfSharedData && !alreadyCachedSharedData) {
    sharedResults[nameOfSharedData] = result
  }

  const listSize = _.isPlainObject(data) ? data?.rows?.length : data?.length
  logger.debug(`Worksheet data - total=${total}, list size=${listSize}'`, RELABEL_EXCEL)

  if (ok) {
    return { data, total, dynamicColumns, fixedColumns, dataSelector, sections, populator, replacements }
  }

  return Boom.preconditionFailed(`Error in function ${functionName} of module ${moduleName} - ${errorMessage}`)
}

// ----------------------------------------------------------------------------------------------
function getDateRangeString({ minDate, maxDate }) {
  const dateFormat = 'dd-MM-yyyy'
  if (!minDate && !maxDate) {
    return 'all'
  }
  const dateFrom = _.isString(minDate) ? new Date(minDate.split('T')[0]) : minDate
  const dateTo = _.isString(maxDate) ? new Date(maxDate.split('T')[0]) : maxDate

  const dates = []
  if (minDate) {
    dates.push(minDate ? format(dateFrom, dateFormat) : '')
  }
  dates.push(' — ') // long dash
  if (maxDate) {
    dates.push(maxDate ? format(dateTo, dateFormat) : '')
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

async function getAssaysNamesString(query) {
  if (!query.assayId) {
    return 'all'
  }
  const items = await knex('Assay as a')
    .modify(filterParams, query, {
      assayId: 'a.id',
    })
    .select('a.name')
  return items.map(x => x.name).join(', ')
}

async function getConsumablesNamesString(query) {
  if (!query.consumableId) {
    return 'all'
  }
  const items = await knex('Consumable as c')
    .modify(filterParams, query, {
      consumableId: 'c.id',
    })
    .select('c.name')
  return items.map(x => x.name).join(', ')
}

async function getAllSheetsData(auth, query, timezone, sheets) {
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
      populator,
      replacements,
    } = await getSheetData(auth, query, timezone, sheet, sharedResults)
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
      // TODO: use i18n string, because `downloadReport()` uses locale file templates with all labels translated
      defaultNoDataMessage: 'No data',
      populator,
      replacements,
    }
  })

  if (boomError) {
    return boomError
  }
  return dataSet
}

async function generateReport(externalId, query, auth, user, userPlaceHolders, extension) {
  const { countryAbbreviation, culture, partnerId, userName, personId, timezoneIANA: timezone } = user

  const { sheets } = await getReportDetails(externalId, { person: { id: personId } })

  const dataQueryStart = Date.now()
  const data = await getAllSheetsData(auth, query, timezone, sheets)
  const dataQueryTimeMs = Date.now() - dataQueryStart
  if (Boom.isBoom(data)) {
    throw data
  }

  const fileGenerationStart = Date.now()

  const administrativeDivisionLabelPlaceHolders = await getAdministrativeDivisionLabelPlaceHolders({
    partnerId,
  })

  const sheetReplacements = data.flatMap(({ replacements }) => (_.isArray(replacements) ? replacements : []))
  const replacements = [
    {
      placeholder: '<Dates>',
      value: getDateRangeString(query),
    },
    {
      placeholder: '<ReportDate>',
      value: new Date().toDateString(),
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
      placeholder: '<Assays>',
      value: await getAssaysNamesString(query),
    },
    {
      placeholder: '<Consumables>',
      value: await getConsumablesNamesString(query),
    },
    {
      // Label lives server-side so every locale template carries the same token text
      // (same approach as <StatesLabel> & co, which appear untranslated in fr/uk files).
      placeholder: '<DecommissionedDevicesLabel>',
      value: 'Decommissioned Devices',
    },
    {
      // Plain truthiness on purpose: it must mirror getResultListConstraintOptions and the
      // device query filters exactly, so the header can never contradict the rows below it.
      placeholder: '<DecommissionedDevices>',
      value: query.showDecommissionedDevices ? 'Included' : 'Excluded',
    },
    {
      placeholder: '<UserEmail>',
      value: userPlaceHolders.email || '-',
    },
    {
      placeholder: '<UserMobilePhone>',
      value: userPlaceHolders.cell || '-',
    },
    {
      placeholder: '<UserFullName>',
      value: userName,
    },
    ...getMaxLimitPlaceHolders(),
    ...administrativeDivisionLabelPlaceHolders,
    ...sheetReplacements,
  ]
  /**
   * generate stream or data buffer
   */
  let dataBuffer
  let streamResponse = false
  if (extension === 'csv') {
    const [sheet] = sheets
    const { streamCSV } = sheet.query || {}
    if (streamCSV) {
      streamResponse = true
      dataBuffer = streamToCsv(data)
    } else {
      dataBuffer = await renderExcelTemplateToCsv({
        countryAbbreviation,
        culture,
        templateFolderPath: externalId,
        data,
        replacements,
      })
    }
  } else {
    /**
     * response is xlsx
     */
    // eslint-disable-next-line no-lonely-if
    if (_.some(sheets, s => s.query.avoidStreaming)) {
      // Response entire file if template has formats and formulae.
      dataBuffer = await renderExcelTemplate({
        countryAbbreviation,
        culture,
        templateFolderPath: externalId,
        data,
        extension,
        replacements,
      })
    } else {
      streamResponse = true
      // Stream the response unless report has formats or formulae.
      dataBuffer = renderExcelStream({
        countryAbbreviation,
        culture,
        externalId,
        data,
        replacements,
        extension,
      })
    }
  }

  // For streaming reports, this measures render setup — not full stream write time.
  const fileGenerationTimeMs = Date.now() - fileGenerationStart

  return { dataBuffer, streamResponse, dataQueryTimeMs, fileGenerationTimeMs }
}

// ----------------------------------------------------------------------------------------------

function renderExcelStream(params) {
  const stream = new Stream.PassThrough()
  const { countryAbbreviation, culture, externalId, data, replacements } = params
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
        templateFolderPath: externalId,
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
  return stream
}

function streamToCsv(dataset) {
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
  return csvStream
}

function transformRow(row, columns, dataSelector) {
  const rowNormalized = {}
  const value = dataSelector ? dataSelector(row) : row
  columns.forEach(({ key, header }) => (rowNormalized[header] = value[key]))

  return rowNormalized
}

module.exports = {
  generateReport,
}
