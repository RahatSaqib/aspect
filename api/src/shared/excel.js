const _ = require('lodash')
const excel = require('exceljs') // see https://www.npmjs.com/package/exceljs
const { getContentType } = require('./io')
const { getUser } = require('../auth/service')

const LANG_DEFAULT = 'en'

// ----------------------------------------------------------------------------------------------
// getCellsByValue - helper function for getting all cells having requested value
// ----------------------------------------------------------------------------------------------
const getCellsByValue = (sheet, value) => {
  const cells = []
  if (sheet) {
    sheet.eachRow(row => {
      row.eachCell(cell => {
        if (cell.value === value) {
          cells.push(cell)
        }
      })
    })
  }
  return cells
}
// ----------------------------------------------------------------------------------------------
// getCellsBySubstring - getting all cells having requested value as substring
// ----------------------------------------------------------------------------------------------
const getCellsBySubstring = (sheet, value) => {
  const cells = []
  if (sheet) {
    sheet.eachRow(row => {
      row.eachCell(cell => {
        if (cell.text.includes(value)) {
          cells.push(cell)
        }
      })
    })
  }
  return cells
}

// ----------------------------------------------------------------------------------------------
// read/write Excel file - 'exceljs' API returns Promise for readFile and writeFile
// ----------------------------------------------------------------------------------------------
// read Excel file and return workbook
async function readExcelFile(fileName) {
  const ExcelWorkbook = new excel.Workbook()
  return ExcelWorkbook.xlsx.readFile(fileName)
}

// ----------------------------------------------------------------------------------------------
function replaceSubstringInCell(worksheet, token, value) {
  getCellsBySubstring(worksheet, token).forEach(cell => {
    cell.value = _.replace(cell.value, token, value)
  })
}

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
async function respondFile({
  reply,
  dataBuffer,
  extension = 'xlsx',
  fileName = 'report',
}) {
  const reportFileName = `${fileName}_${new Date().toISOString()}.${extension}`
  return reply
    .response(dataBuffer)
    .encoding('binary')
    .type(getContentType(extension))
    .header('content-disposition', `attachment; filename=${reportFileName};`)
}

// ----------------------------------------------------------------------------------------------
async function readTemplateFile(
  templateFolderPath,
  lang,
  langDefault = LANG_DEFAULT
) {
  return readExcelFile(`templates/${templateFolderPath}/${lang}.xlsx`).catch(
    error => {
      if (lang !== langDefault) {
        return readExcelFile(
          `templates/${templateFolderPath}/${langDefault}.xlsx`
        )
      }
      // if no file found - alarm
      throw error
    }
  )
}

// ----------------------------------------------------------------------------------------------
async function renderExcelTemplate({
  culture,
  data, // i.e. data[0] is array of items for 1st sheet, data[1] for 2nd sheet, etc
  extension,
  replacements = [],
  templateFolderPath,
}) {
  const lang = culture.split('-')[0].toLowerCase()

  // read file into workbook as ExcelWorkbook
  const workbook = await readTemplateFile(
    templateFolderPath,
    lang,
    LANG_DEFAULT
  )

  // get worksheets with specified in API way, 'workbook.worksheets' also works but not specified in API
  const worksheets = []
  workbook.eachSheet(worksheet => {
    worksheets.push(worksheet)
  })

  // process all sheets
  _.each(worksheets, async (worksheet, sheetIndex) => {
    // replace placeholders, i.e. <Dates>, <States>, etc in the header
    _.each(replacements, ({ placeholder, value }) => {
      replaceSubstringInCell(worksheet, placeholder, value)
    })

    // position cell where data table begins
    const cells = getCellsByValue(worksheet, '<Table>')

    if (cells.length > 0) {
      // empty cells
      cells.forEach(cell => {
        cell.value = ''
      })

      const { dataRows, defaultNoDataMessage } = data[sheetIndex]
      if (!dataRows) return

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
            const value = fieldIndex === 0 ? defaultNoDataMessage : ''
            return value
          }),
        ]
      }

      // remove pattern row and insert rows from patternRowNumber
      worksheet.spliceRows(patternRowNumber, 1, ...rows)
    }
  })

  // return binary buffer
  return extension === 'csv'
    ? workbook.csv.writeBuffer()
    : workbook.xlsx.writeBuffer()
}

// ----------------------------------------------------------------------------------------------
async function exportData(request, reply, sheetData, scope, options) {
  const { replacements = [] } = options
  const {
    auth,
    query: { format: extension },
  } = request
  const { culture } = await getUser(auth.credentials.name)
  const dataBuffer = await renderExcelTemplate({
    culture,
    templateFolderPath: `export/${scope}`,
    data: [sheetData],
    extension,
    replacements,
  })
  return respondFile({ dataBuffer, extension, fileName: scope, reply })
}

// ----------------------------------------------------------------------------------------------
module.exports = {
  exportData,
  getCellsBySubstring,
  getCellsByValue,
  readExcelFile,
  renderExcelTemplate,
  respondFile,
}
