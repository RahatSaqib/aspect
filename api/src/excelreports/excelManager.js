const Excel = require('exceljs')
const fs = require('fs')

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
  rowsNext = 0
) {
  const indexRow = setColumnsKeys(worksheet, placeHolderTag, rowsNext)
  worksheet.spliceRows(indexRow, 1, ...dataCollection)
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
async function generateReport(
  format,
  reportTemplate,
  placeHolderTag,
  data,
  placeHolderTagValuesIndex = 0
) {
  let workbook = new Excel.Workbook()
  workbook = await workbook.xlsx.readFile(reportTemplate)
  const worksheet = workbook.getWorksheet(1)
  setColumnsKeysAndBindData(
    worksheet,
    placeHolderTag,
    data,
    placeHolderTagValuesIndex
  )

  const stream = fs.writeFileSync(`prueba1devices.${format}`)
  if (format === 'xlsx') return workbook.xlsx.write(stream)
  return workbook.csv.write(stream)
}
module.exports = {
  findContentInExcelRow,
  setColumnsKeysAndBindData,
  findContentInExcelSheet,
  replaceContentInExcelSheet,
  setColumnsKeys,
  generateReport,
}
