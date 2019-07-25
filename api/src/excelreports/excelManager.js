const Excel = require('exceljs')

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
  const indexRow = setColumnsKeys(worksheet, placeHolderTag, rowsNext)
  if (dataCollection.length > 0)
    worksheet.spliceRows(indexRow, 1, ...dataCollection)
  else setMessageOnRow(worksheet, indexRow, defaultNoDataMessage)
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
function setColumnsKeys(worksheet, placeHolderTag, rowsNext = 0) {
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

  if (format !== 'csv') return workbook.xlsx.writeBuffer()
  return workbook.csv.writeBuffer()
}
module.exports = {
  findContentInExcelRow,
  setColumnsKeysAndBindData,
  findContentInExcelSheet,
  replaceContentInExcelSheet,
  setColumnsKeys,
  generateReport,
}
