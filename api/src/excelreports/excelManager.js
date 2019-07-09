// const Excel = require('./exceljs')

function findContentInExcelRow(
  row,
  placeHolderTag,
  startColumnIndex = 0,
  endColumnIndex = 9999
) {
  let cellNumber = null
  if (row != null) {
    row.eachCell((cell, colNumber) => {
      // console.log('la celda maxima', cell.value, placeHolderTag, colNumber)
      if (
        cell.value === placeHolderTag &&
        colNumber >= startColumnIndex &&
        colNumber <= endColumnIndex
      ) {
        console.log('match')
        cellNumber = colNumber
        return cellNumber
      }
    })
  }
  if (cellNumber) {
    console.log('celda encontrada', row.getCell(cellNumber).value)
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
    // console.log(row.values)
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

function setColumnsKeys(worksheet, placeHolderTag, rowsNext = 0) {
  const cell = findContentInExcelSheet(worksheet, placeHolderTag)
  if (cell) {
    const columns = []
    cell.value = ''
    worksheet.getRow(cell.rowNumber + rowsNext).eachCell((cell, colNumber) => {
      columns[colNumber - 1] = {
        key: cell.value.replace(new RegExp('[<|>]', 'g'), ''),
      }
      cell.value = ''
    })
    console.log('columns', columns)
    worksheet.columns = columns
    worksheet.spliceRows(cell.rowNumber + rowsNext, 2)
  }
}
module.exports = {
  findContentInExcelRow,
  findContentInExcelSheet,
  setColumnsKeys,
}
