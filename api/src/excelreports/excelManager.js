const Excel = require('exceljs')
const _ = require('lodash')

function findContentInExcelRow(
  row,
  placeHolderTag,
  startColumnIndex = 0,
  endColumnIndex = 9999
) {
  let cellNumber = null
  if (row != null) {
    row.eachCell((cell, colNumber) => {
      if (
        cell.value === placeHolderTag &&
        colNumber >= startColumnIndex &&
        colNumber <= endColumnIndex
      ) {
        cellNumber = colNumber
        return cellNumber
      }
    })
  }
  if (cellNumber) {
    return row.getCell(cellNumber)
  }
  return null
}
function findContentInExcelSheet(
  worksheet,
  placeHolderTag,
  startColumnIndex = 0,
  endColumnIndex = 9999
) {
  let rowCell = null
  worksheet.eachRow((row, rowNumber) => {
    const cell = findContentInExcelRow(
      row,
      placeHolderTag,
      startColumnIndex,
      endColumnIndex
    )
    if (cell != null) {
      rowCell = cell
      rowCell.rowNumber = rowNumber
    }
  })
  if (rowCell) {
    return rowCell
  }
  return null
}

function replaceContentInExcelSheet(
  worksheet,
  placeHolderTag,
  stringToReplace,
  startColumnIndex = 0,
  endColumnIndex = 9999
) {
  const cell = findContentInExcelSheet(
    worksheet,
    placeHolderTag,
    startColumnIndex,
    endColumnIndex
  )
  if (cell != null) cell.value = stringToReplace
}
function setColumnsKeysAndBindData(
  worksheet,
  placeHolderTag,
  dataCollection,
  rowsNext = 0,
  defaultNoDataMessage
) {
  const indexRow = setColumnsKeysByPlaceHolder(
    worksheet,
    placeHolderTag,
    rowsNext
  )
  const lastRowCount = worksheet.actualRowCount

  if (dataCollection.length > 0) {
    const cellsBorderStyleFormat = []
    const cellsAlignmentStyleFormat = []
    const cellsFillStyleFormat = []
    const cellsFontStyleFormat = []

    const getReferenceStyleRow = worksheet.getRow(lastRowCount)

    getReferenceStyleRow.eachCell(cell =>
      cellsBorderStyleFormat.push(cell.border)
    )
    getReferenceStyleRow.eachCell(cell =>
      cellsAlignmentStyleFormat.push(cell.alignment)
    )
    getReferenceStyleRow.eachCell(cell => cellsFillStyleFormat.push(cell.fill))
    getReferenceStyleRow.eachCell(cell => cellsFontStyleFormat.push(cell.font))

    worksheet.spliceRows(indexRow, 1, ...dataCollection)
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber >= lastRowCount) {
        row.eachCell({ includeEmpty: true }, (cell, cellNumber) => {
          cell.border = cellsBorderStyleFormat[cellNumber - 1]
          cell.alignment = cellsAlignmentStyleFormat[cellNumber - 1]
          cell.fill = cellsFillStyleFormat[cellNumber - 1]
          cell.font = cellsFontStyleFormat[cellNumber - 1]
        })
      }
    })
  } else setMessageOnRow(worksheet, indexRow, defaultNoDataMessage)
}

function setMessageOnRow(worksheet, rowIndex, defaultNoDataMessage) {
  const row = worksheet.getRow(rowIndex)
  if (row) {
    worksheet.mergeCells(
      `${row.getCell(1).address}:${row.getCell(row.cellCount).address}`
    )
    row.getCell(1).value = defaultNoDataMessage
    row.getCell(1).alignment = { horizontal: 'center' }
  }
}

// it set up the keys for the columns headers and return the row index where you are goint to add data rows
function setColumnsKeysByPlaceHolder(worksheet, placeHolderTag, rowsNext = 0) {
  const cell = findContentInExcelSheet(worksheet, placeHolderTag)
  if (cell) {
    const columns = []
    cell.value = ''
    worksheet.getRow(cell.rowNumber + rowsNext).eachCell((cell, colNumber) => {
      columns[colNumber - 1] = {
        key: cell.value.replace(new RegExp('[<|>]', 'g'), ''),
        style: worksheet.getColumn(colNumber).style,
        width: worksheet.getColumn(colNumber).width,
      }
      cell.value = ''
    })

    worksheet.columns = columns
    return cell.rowNumber + rowsNext
  }
}
// This functions manage everything about the report template.
// the parameters are:
// The format (csv or xlsx)
// the path of the report template file
// The place holder which we are looking for replacements.
// the data source (Every property are going to match with <propertyname> tag and,
//           if it finds into the template, the tag is going to be replaced with the property value)
// headersData: is the object with properties we are going to replace in the header.
// placeHolderTagValuesIndex: is the relative index from the header row, where we have to start replacing the values.
// worksheetName: is the worksheet name or number for the current workbook, where we are going to work with.
async function generateReport(
  format,
  reportTemplate,
  placeHolderTag,
  data,
  headersData,
  placeHolderTagValuesIndex = 0,
  worksheetName = 1,
  defaultNoDataMessage = 'No data for this period'
) {
  let workbook = new Excel.Workbook()
  workbook = await workbook.xlsx.readFile(reportTemplate)

  const worksheet = workbook.getWorksheet(worksheetName)

  if (headersData) {
    for (const key in headersData) {
      if ({}.hasOwnProperty.call(headersData, key)) {
        replaceContentInExcelSheet(worksheet, `<${key}>`, headersData[key])
      }
    }
  }
  setColumnsKeysAndBindData(
    worksheet,
    placeHolderTag,
    data,
    placeHolderTagValuesIndex,
    defaultNoDataMessage
  )

  return generateReportFile(workbook, format)
}
async function generateWorkbookByDataSource(
  format,
  data,
  workSheetName,
  columnsSchema,
  reportTitle,
  rowsConversionFunction = null
) {
  const workbook = new Excel.Workbook()
  const worksheet = workbook.addWorksheet(workSheetName)

  worksheet.columns = columnsSchema
  worksheet.columns.forEach(column => {
    column.width = column.header.length + 2
  })
  worksheet.getRow(4).values = _.map(columnsSchema, elem => elem.header)
  worksheet.getRow(4).eachCell(cell => {
    cell.border = {
      top: { style: 'double', color: { argb: 'FFFFFFFF' } },
      left: { style: 'double', color: { argb: 'FFFFFFFF' } },
      bottom: { style: 'double', color: { argb: 'FFFFFFFF' } },
      right: { style: 'double', color: { argb: 'FFFFFFFF' } },
    }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '803CC0DD' },
    }
    cell.font = {
      bold: true,
    }
  })
  worksheet.spliceRows(1, 1)
  worksheet.mergeCells('A1', 'C1')
  worksheet.getCell('A1').value = reportTitle

  worksheet.getCell('A1').font = {
    size: 20,
    bold: true,
  }

  if (!rowsConversionFunction) {
    worksheet.addRows(data)
  } else {
    data.forEach(element => {
      worksheet.addRow(rowsConversionFunction(element))
    })
  }

  return generateReportFile(workbook, format)
}
async function generateReportFile(workbook, format) {
  if (format && format.toLowerCase() !== 'csv')
    return workbook.xlsx.writeBuffer()
  return workbook.csv.writeBuffer()
}
async function downloadReportFile(
  reportFunction,
  reply,
  format,
  fileName = 'report_'
) {
  await reportFunction
    .then(resp => {
      reply(resp)
        .encoding('binary')
        .type('application/octet-stream')
        .header(
          'content-disposition',
          `attachment; filename=${fileName}_${new Date().toISOString()}.${format};`
        )
    })

    .catch(err => {
      console.error('Error ', err) // eslint-disable-line no-console
      reply(err)
    })
}

module.exports = {
  findContentInExcelRow,
  setColumnsKeysAndBindData,
  findContentInExcelSheet,
  replaceContentInExcelSheet,
  setColumnsKeysByPlaceHolder,
  generateReport,
  generateWorkbookByDataSource,
  downloadReportFile,
  generateReportFile,
}
