const _ = require('lodash')
const path = require('path')
const { format } = require('date-fns')
const Promise = require('bluebird')
const { stringify } = require('querystring')
const excel = require('exceljs')

const { getUser } = require('../auth/service')
const { getReportDetails, listReports } = require('./service')
const {
  generateReport,
  downloadReportFile,
} = require('../excelreports/excelManager')
const { getCellsByValue, getContentType } = require('../shared/io')

const LANG_DEFAULT = 'en'
// ----------------------------------------------------------------------------------------------
function getLabel(labels, lang, key) {
  let keys = labels[lang]
  let label = keys[key]
  if (!label && lang !== LANG_DEFAULT) {
    keys = labels[LANG_DEFAULT]
    label = keys[key]
  }
  return label
}
// ----------------------------------------------------------------------------------------------
function setText(worksheet, labels, lang, token) {
  const cells = getCellsByValue(worksheet, token)
  cells.forEach(cell => {
    const key = _.trim(cell.value, '< >')
    const label = getLabel(labels, lang, key)
    if (label) {
      cell.value = label
    }
  })
}
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
function getReportLabels(externalId, lang) {
  const reportLabels = {
    [LANG_DEFAULT]: require(`../../templates/${externalId}/${LANG_DEFAULT}`) //eslint-disable-line
  }
  if (lang !== LANG_DEFAULT) {
    reportLabels[lang] = require(`../../templates/${externalId}/${lang}`) //eslint-disable-line
  }
  return reportLabels
}
// ----------------------------------------------------------------------------------------------
function getSheetLabels(reportLabels, lang, sheetIndex) {
  const labels = {}
  _.keys(reportLabels).forEach(langKey => {
    labels[langKey] = reportLabels[langKey].sheets[sheetIndex]
  })
  return labels
}
// ----------------------------------------------------------------------------------------------
async function createReport(request, reply) {
  const { auth, query, params, server } = request
  const { externalId } = params
  const reportProfile = await getReportDetails(auth, externalId)
  const { sheets, fileNamePrefix } = reportProfile
  // language
  const { culture } = await getUser(auth.credentials.name)
  const lang = culture.split('-')[0].toLowerCase()
  const reportLabels = getReportLabels(externalId, lang)

  // read file into workbook
  let fileName = `templates/${externalId}/template.xlsx`
  const ExcelWorkbook = new excel.Workbook()
  const workbook = await ExcelWorkbook.xlsx.readFile(fileName)

  // process all sheets
  await Promise.each(sheets, async (sheet, sheetIndex) => {
    // get data
    const { sheetName } = sheet

    // get data for this sheet
    const dataRows = await getSheetData(server, auth, query, sheet)

    // labels with translations for current sheet
    const labels = getSheetLabels(reportLabels, lang, sheetIndex)

    // get sheet (1-based)
    const worksheet = workbook.getWorksheet(sheetIndex + 1)
    worksheet.name = sheetName || `Sheet${sheetIndex + 1}`

    // process sheet header rows
    setText(worksheet, labels, lang, '<Title>')
    setText(worksheet, labels, lang, '<Dates>')
    setText(worksheet, labels, lang, '<States>')

    // position cell where data table begins
    const cells = getCellsByValue(worksheet, '<Table>')
    if (cells.length > 0) {
      // empty cells
      cells.forEach(cell => {
        cell.value = ''
      })

      // use 1st cell only (actually, should not be more than one)
      const cellTableToken = cells[0]

      // process table Header row(s)
      const headerRows = getHeaderRows(worksheet, cellTableToken)
      headerRows.forEach(headerRow => {
        headerRow.eachCell(cell => {
          let v = _.trim(cell.value, ' ')
          // if cell contains value in format <Xxx> then replace it to corresponding translation
          if (v[0] === '<' && v[v.length - 1] === '>') {
            v = _.trim(v, '< >')
            cell.value = getLabel(labels, lang, v)
          }
        })
      })

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
  fileName = `${fileNamePrefix}_${new Date().toISOString()}.${ext}`

  // resolve promise by returning any value and respond binary stream with generated Excel file
  return reply
    .response(resultBuffer)
    .encoding('binary')
    .type(getContentType(ext))
    .header('content-disposition', `attachment; filename=${fileName};`)
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
