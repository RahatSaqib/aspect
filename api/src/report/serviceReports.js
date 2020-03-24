const _ = require('lodash')
const Boom = require('@hapi/boom')
const path = require('path')
const { format } = require('date-fns')
const Promise = require('bluebird')
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
  let numRowsInHeader = 1
  if (cell) {
    const v = cell.value
    const num = parseInt(v, 10)
    numRowsInHeader = !Number.isInteger(num) || num <= 0 ? 1 : num
    cell.value = ''
  }
  const headerRows = []
  for (let j = 1; j <= numRowsInHeader; j++) {
    headerRows.push(sheet.getRow(cellTableToken.row + j))
  }
  return headerRows
}
// ----------------------------------------------------------------------------------------------
async function getSheetData(request, sheet) {
  const { auth } = request
  const { moduleName, functionName } = sheet
  const query = {
    // filters defined on Reports page
    ...request.query,
    // make sure to report all results (up to 1 million records)
    page: 0,
    size: 999999,
    // specific params for endpoint from ReportSheet table, i.e. sortCol, sortDir
    ...sheet.query,
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
    return Boom.preconditionFailed(
      `Can not load module ${moduleName}: ${error.toString()}`
    )
  }

  const dataFunc = endpointModule[functionName]
  if (!dataFunc) {
    return Boom.preconditionFailed(
      `Can not find function ${functionName} in module ${moduleName}`
    )
  }
  const result = await dataFunc(auth, query)
  const { ok, data, errorMessage } = result
  if (ok) {
    return data
  }

  return Boom.preconditionFailed(
    `Error in function ${functionName} of module ${moduleName} - ${errorMessage}`
  )
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
function getDateRangeString({ minDate, maxDate }) {
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
// ----------------------------------------------------------------------------------------------
function replaceSubstringInCell(worksheet, token, value) {
  getCellsBySubstring(worksheet, token).forEach(cell => {
    cell.value = _.replace(cell.value, token, value)
  })
}
// ----------------------------------------------------------------------------------------------
async function createReport(request, reply) {
  const { auth, query, params } = request
  const { externalId } = params
  const { sheets, fileName } = await getReportDetails(auth, externalId)
  // language
  const { culture } = await getUser(auth.credentials.name)
  const lang = culture.split('-')[0].toLowerCase()

  // read file into workbook
  const workbook = await readTemplateFile(externalId, lang, LANG_DEFAULT)

  const dateRangeString = getDateRangeString(query)
  const statesString = await getStateNames(query)
  const lgasString = await getLgaNamesString(query)

  // get worksheets (this also works - workbook.worksheets - but it is not specified in API doc)
  const worksheets = []
  workbook.eachSheet(worksheet => {
    worksheets.push(worksheet)
  })

  let boomError
  // process all sheets
  await Promise.each(sheets, async (sheet, sheetIndex) => {
    if (!sheet || boomError) return

    // get data for this sheet
    const dataRows = await getSheetData(request, sheet)
    if (Boom.isBoom(dataRows)) {
      boomError = dataRows
      return
    }

    // get sheet
    const worksheet = worksheets[sheetIndex]
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
      let rows = []
      if (dataRows.length > 0) {
        rows = dataRows.map((dataRow, rowIndex) => {
          return fieldNames.map(fieldName => {
            if (fieldName === '#') {
              return rowIndex + 1
            }
            let value = fieldName && dataRow[fieldName]
            value = _.isNil(value) ? '' : value
            if (fieldName === 'patientAge' && value === 'null') {
              value = ''
            }
            return value
          })
        })
      } else {
        rows = [
          fieldNames.map((fieldName, fieldIndex) => {
            const value = fieldIndex === 0 ? 'No data' : ''
            return value
          }),
        ]
      }

      // remove pattern row and insert rows from patternRowNumber
      worksheet.spliceRows(patternRowNumber, 1, ...rows)
    }
  })

  if (boomError) {
    throw boomError
  }

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
