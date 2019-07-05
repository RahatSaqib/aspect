// const Excel = require('./exceljs')

function findContentInExcelRow(
  row,
  placeHolderTag,
  startColumnIndex = 0,
  endColumnIndex = 9999
) {
  if (row != null && row.Cells != null) {
    return row.eachCell((cell, colNumber) => {
      if (
        cell.value === placeHolderTag &&
        colNumber >= startColumnIndex &&
        colNumber <= endColumnIndex
      ) {
        cell.colNumber = colNumber
        return cell
      }
    })
  }

  return null
}
function findContentInExcelSheet(
  worksheet,
  placeHolderTag,
  startColumnIndex = 0,
  endColumnIndex = 9999
) {
  worksheet.eachRow((row, rowNumber) => {
    const cell = findContentInExcelRow(
      row,
      placeHolderTag,
      startColumnIndex,
      endColumnIndex
    )
    if (cell != null) cell.rowNumber = rowNumber
    return cell
  })

  return null
}

function setColumnsKeys(worksheet, placeHolderTag, rowsNext = 0) {
  const cell = findContentInExcelSheet(worksheet, placeHolderTag)
  const columns = []
  worksheet.getRow(cell.rowNumber + rowsNext).eachCell((cell, colNumber) => {
    columns[colNumber] = {
      key: cell.value.replace(new RegExp('[<|>]', 'g'), ''),
    }
  })
  worksheet.columns = columns
}
module.exports = {
  findContentInExcelRow,
  findContentInExcelSheet,
  setColumnsKeys,
}
