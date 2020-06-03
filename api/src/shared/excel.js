const _ = require('lodash')
const { format } = require('date-fns')
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
  fileNamePrefix = 'report',
}) {
  const reportFileName = `${fileNamePrefix}_${new Date().toISOString()}.${extension}`
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
function getBaseReplacements() {
  const replacements = [
    {
      placeholder: '<date>',
      value: format(new Date(), 'yyyy-MM-dd'),
    },
  ]
  return replacements
}

// ----------------------------------------------------------------------------------------------
function getCellStyle(cell) {
  if (cell.master) {
    return cell.master.style
  }
  return cell.style
}

// ----------------------------------------------------------------------------------------------
function setCellStyle(cell, style) {
  _.forEach(style, (styleValue, styleName) => {
    cell[styleName] = styleValue
  })
}

// ----------------------------------------------------------------------------------------------
async function renderExcelTemplate({
  culture,
  columns = [], // dynamic columns to generate at run-time and append at the end of predefined header columns
  data, // i.e. data[0] is array of items for 1st sheet, data[1] for 2nd sheet, etc
  extension, // xlsx
  replacements = [],
  templateFolderPath,
  dataSelector,
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
    if (extension === 'csv' && sheetIndex > 0) {
      return
    }

    // replace placeholders, i.e. <Dates>, <States>, etc in the header
    _.each(replacements, ({ placeholder, value }) => {
      replaceSubstringInCell(worksheet, placeholder, value)
    })

    // position cell where data table begins
    const tableTokenCells = getCellsByValue(worksheet, '<Table>')

    if (tableTokenCells.length > 0) {
      // empty cells
      tableTokenCells.forEach(cell => {
        cell.value = ''
      })

      const { dataRows, defaultNoDataMessage } = data[sheetIndex]
      if (!dataRows) return

      // use 1st cell only (actually, should not be more than one)
      const cellTableToken = tableTokenCells[0]

      const allHeaderRows = getHeaderRows(worksheet, cellTableToken)
      const headerRow = allHeaderRows[0]
      const patternRowNumber = cellTableToken.row + 1 + allHeaderRows.length
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

      // append dynamic columns if specified
      if (columns.length > 0) {
        addColumnsToHeader(worksheet, columns, headerRow, allHeaderRows.length)
      }

      // fill in array 'rows'
      let rows = []
      if (dataRows.length > 0) {
        rows = dataRows.map((dataRow, rowIndex) => {
          const valuesInPredefinedColumns = fieldNames.map(fieldName => {
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
          let valuesInDynamicColumns = []
          if (columns.length > 0 && dataSelector) {
            const normalizedValues = dataSelector(dataRow)
            valuesInDynamicColumns = columns.map(
              column => normalizedValues[column.key]
            )
          }
          return [...valuesInPredefinedColumns, ...valuesInDynamicColumns]
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

      if (extension === 'csv') {
        // get all header values from last item of array allHeaderRows
        const headerRow = allHeaderRows[allHeaderRows.length - 1]
        const headerValues = []
        headerRow.eachCell(cell => {
          headerValues.push(cell.value)
        })

        // put headers in 1st row
        worksheet.getRow(1).values = headerValues

        // remove all rows between 1st row and table body (remove table headers too)
        worksheet.spliceRows(2, patternRowNumber - 1 - 1)
      }
    }
  })

  // return binary buffer
  return extension === 'csv'
    ? workbook.csv.writeBuffer()
    : workbook.xlsx.writeBuffer()
}

// ----------------------------------------------------------------------------------------------
async function exportData(request, reply, sheetData, scope, options) {
  const { auth } = request
  const extension = request.query.format || 'xlsx'

  const { culture } = await getUser(auth.credentials.name)
  const dataBuffer = await renderExcelTemplate({
    culture,
    templateFolderPath: `export/${scope}`,
    data: [sheetData],
    extension,
    ...options,
  })
  return respondFile({ dataBuffer, extension, fileNamePrefix: scope, reply })
}

// ----------------------------------------------------------------------------------------------
function addColumnsToHeader(worksheet, columns, headerRow, totalHeaderRows) {
  const lastPredefinedCellNumber = headerRow.cellCount
  const lastPredefinedCellStyle = getCellStyle(
    headerRow.getCell(lastPredefinedCellNumber)
  )

  // keep styles of all predefined cells in 1st header rows
  const cellStyles = []
  const headerRowCells = []
  headerRow.eachCell((cell, cellNumber) => {
    headerRowCells.push({
      cell,
      cellNumber,
      totalMerged: 1,
    })

    let { value } = cell
    if (cellNumber > 1) {
      const isMerged = cell !== cell.master
      if (isMerged) {
        const masterCell = headerRowCells.find(c => c.cell === cell.master)
        if (masterCell) {
          masterCell.totalMerged += 1
        }
      }
      value = isMerged ? undefined : value
    }
    cellStyles.push({ ...cell.style, value })
  })

  // get existing values
  const headerRowValues = []
  headerRow.eachCell(cell => headerRowValues.push(cell.value))

  // update row
  headerRow.values = [
    ...headerRowValues,
    ...columns.map(column => column.header),
  ]
  headerRow.commit()

  // loop all cells and merge cells (if needed) and set styles
  headerRow.eachCell((cell, cellNumber) => {
    const cellStyle =
      cellNumber <= lastPredefinedCellNumber
        ? cellStyles[cellNumber - 1]
        : lastPredefinedCellStyle

    if (cellNumber <= lastPredefinedCellNumber) {
      const refCell = headerRowCells.find(c => c.cellNumber === cellNumber)
      const { totalMerged } = refCell
      if (totalMerged > 1) {
        // merge by start row, start column, end row, end column (equivalent to K10:M12)
        worksheet.unMergeCells(
          cell.row,
          cellNumber,
          cell.row,
          cellNumber + totalMerged - 1
        )
        worksheet.mergeCells(
          cell.row,
          cellNumber,
          cell.row,
          cellNumber + totalMerged - 1
        )
      }
    } else if (totalHeaderRows > 1) {
      // merge by start row, start column, end row, end column (equivalent to K10:M12)
      worksheet.mergeCells(
        cell.row,
        cellNumber,
        cell.row + totalHeaderRows - 1,
        cellNumber
      )
    }

    if (cell === cell.master) {
      setCellStyle(cell, cellStyle)
    }
  })
}

// ----------------------------------------------------------------------------------------------
module.exports = {
  exportData,
  getBaseReplacements,
  getCellsBySubstring,
  getCellsByValue,
  readExcelFile,
  renderExcelTemplate,
  respondFile,
}
