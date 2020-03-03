const _ = require('lodash')
const path = require('path')
const { format } = require('date-fns')
const Promise = require('bluebird')
const { stringify } = require('querystring')
const { knex } = require('../db')

const { getUser } = require('../auth/service')
const { getReportDetails, listReports } = require('./service')
const {
  generateReport,
  downloadReportFile,
} = require('../excelreports/excelManager')
const {
  getCellsBySubstring,
  getCellsByValue,
  getContentType,
  readExcelFile,
} = require('../shared/io')
const { formatDateOrDefault } = require('../shared/date')

const LANG_DEFAULT = 'en'

// ----------------------------------------------------------------------------------------------
function getHeaderRows(sheet, cellTableToken) {
  const row = sheet.getRow(cellTableToken.row)
  const cell = row.findCell(cellTableToken.col + 1)
  const v = cell.value
  const num = parseInt(v, 10)
  const numRowsInHeader = !Number.isInteger(num) || num <= 0 ? 1 : num
  const headerRows = []
  for (let j = 1; j <= numRowsInHeader; j++) {
    headerRows.push(sheet.getRow(cell.row + j))
  }
  cell.value = ''
  return headerRows
}
// ----------------------------------------------------------------------------------------------
async function getSheetData(server, auth, reportQuery, sheet) {
  const { endpoint } = sheet
  const sheetQuery = sheet.query ? JSON.parse(sheet.query) : {}
  const { statusCode, result } = await server.inject({
    method: 'GET',
    url: `${endpoint}?${stringify({
      // `query` contains filters defined on Reports page
      ...reportQuery,
      // make sure to report all results (up to 1 million records)
      page: 0,
      size: 999999,
      // specific params for endpoint, i.e. sortCol, sortDir
      ...sheetQuery,
    })}`,
    auth,
  })

  if (statusCode === 200 && result) {
    const { ok, data } = result
    if (ok) {
      return data
    }
  } else {
    console.log('Error in getting sheet data', { statusCode }) //eslint-disable-line
  }

  return []
}
// ----------------------------------------------------------------------------------------------
async function readTemplateFile(externalId, lang, langDefault) {
  return readExcelFile(`templates/${externalId}/${lang}.xlsx`).catch(error => {
    if (langDefault && lang !== langDefault) {
      return readExcelFile(`templates/${externalId}/${langDefault}.xlsx`)
    }
    throw error
  })
}
// ----------------------------------------------------------------------------------------------
function getDateRange({ minDate, maxDate }) {
  if (!minDate && !maxDate) {
    return 'all'
  }
  const dates = []
  if (minDate) {
    dates.push(minDate ? formatDateOrDefault(minDate) : '')
  }
  dates.push(' — ') // long dash
  if (maxDate) {
    dates.push(maxDate ? formatDateOrDefault(maxDate) : '')
  }
  return dates.join('')
}
// ----------------------------------------------------------------------------------------------
async function getStatesCsv({ countryId, stateId }) {
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
async function getLgasCsv({ countryId, stateId, lgaId }) {
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
// ----------------------------------------------------------------------------------------------
function replaceSubstringInCell(worksheet, token, value) {
  getCellsBySubstring(worksheet, token).forEach(cell => {
    cell.value = _.replace(cell.value, token, value)
  })
}
// ----------------------------------------------------------------------------------------------
async function createReport(request, reply) {
  const { auth, query, orig, params, server } = request
  const { externalId } = params
  const { sheets, fileName } = await getReportDetails(auth, externalId)
  // language
  const { culture } = await getUser(auth.credentials.name)
  const lang = culture.split('-')[0].toLowerCase()

  // for server.inject we can not use request.query because it contains parsed data,
  // i.e. Joi.date parses date string into Date object but we
  // need raw string to pass it to another endpoint as like it arrived from client side.
  // That's why instead of request.query we need request.orig.query which contains all
  // passed query values as strings which we concat together with stringify (see func getSheetData)
  const reportQuery = orig.query

  // read file into workbook
  const workbook = await readTemplateFile(externalId, lang, LANG_DEFAULT)

  const dateRangeString = getDateRange(query)
  const statesString = await getStatesCsv(query)
  const lgasString = await getLgasCsv(query)

  // process all sheets
  await Promise.each(sheets, async (sheet, sheetIndex) => {
    // get data
    const { sheetName } = sheet

    // get data for this sheet
    const dataRows = await getSheetData(server, auth, reportQuery, sheet)

    // get sheet (1-based)
    const worksheet = workbook.getWorksheet(sheetIndex + 1)
    worksheet.name = sheetName || `Sheet${sheetIndex + 1}`

    // replace few placeholders in sheet header
    replaceSubstringInCell(worksheet, '<Dates>', dateRangeString)
    replaceSubstringInCell(worksheet, '<States>', statesString)
    replaceSubstringInCell(worksheet, '<Lgas>', lgasString)

    // position cell where data table begins
    const cells = getCellsByValue(worksheet, '<Table>')
    if (cells.length > 0) {
      // empty cells
      cells.forEach(cell => {
        cell.value = ''
      })

      // use 1st cell only (actually, should not be more than one)
      const cellTableToken = cells[0]

      // get table Header row(s) - for future conditional formatting
      const headerRows = getHeaderRows(worksheet, cellTableToken)
      //
      const patternRowNumber = cellTableToken.row + 1 + headerRows.length
      const patternRow = worksheet.getRow(patternRowNumber)
      // field names for data table - order of array elements should match columns order in template file
      const fieldNames = []
      patternRow.eachCell(cell => {
        let v = _.trim(cell.value)
        if (v[0] === '<' && v[v.length - 1] === '>') {
          v = _.trim(v, '< >')
          fieldNames.push(v)
        } else {
          fieldNames.push('')
        }
      })

      // fill in array 'rows'
      const rows = dataRows.map((dataRow, rowIndex) => {
        return fieldNames.map(fieldName => {
          if (fieldName === '#') {
            return rowIndex + 1
          }
          let value = (fieldName && dataRow[fieldName]) || ''
          if (fieldName === 'patientAge' && value === 'null') {
            value = ''
          }
          return value
        })
      })

      // remove pattern row and insert rows from patternRowNumber
      worksheet.spliceRows(patternRowNumber, 1, ...rows)
    }
  })

  const resultBuffer = await workbook.xlsx.writeBuffer()

  // report file Name
  const ext = 'xlsx'
  const reportFileName = `${fileName}_${new Date().toISOString()}.${ext}`

  // resolve promise by returning any value and respond binary stream with generated Excel file
  return reply
    .response(resultBuffer)
    .encoding('binary')
    .type(getContentType(ext))
    .header('content-disposition', `attachment; filename=${reportFileName};`)
}
// ----------------------------------------------------------------------------------------------
async function getReport(request, reply) {
  // get whole dataset - based on current query params (sorting, filtering) and auth constraints
  const reports = await listReports(request)
  const { query } = request
  const reportFile = path.join(
    __dirname,
    '../excelreports/reportTemplates/Reports.xlsx'
  )
  const report = generateReport(
    query.format, // xlsx or csv
    reportFile, // the path to the exceltemplate
    '<Headers>', // This is an invented tag to look for, in the report template, for selecting the first cell we want to work with.
    // Also we can find a text for a header instead of create a place holder.
    reports.data,
    // this is the data source to create the reportvalues.
    // It should be an Array of JSON objects, where each must be plained (Without nested properties)
    {
      date: format(new Date(), 'yyyy-MM-dd'),
    }, // the json object to replace values in the header.
    2 // If the function locate the row number for the placeholder,
    // how many rows after appears the placeholders for the values (default 0)
  )
  return downloadReportFile(report, reply, request.format)
}
module.exports = {
  createReport,
  getReport,
}
