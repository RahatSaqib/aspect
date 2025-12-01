// NEW EXCEL.JS
/* eslint-disable no-underscore-dangle */
const _ = require('lodash')
const { format } = require('date-fns')
const excel = require('exceljs') // see https://www.npmjs.com/package/exceljs
const Range = require('exceljs/lib/doc/range')
const { readExcelFile, readTemplateFile } = require('./io')
const { getDisplayPreferences, getUser } = require('../auth/service')
const logger = require('./logger')
const { RELABEL_EXCEL } = require('./constants')
const { respondFile } = require('./response')
const {
  basePlugin: { settings },
} = require('../plugin/plugins/basePlugin')

const LANG_DEFAULT = 'en'

/**
  Notice that `cell.type` and `cell.effectiveType` are set to global constant `excel.ValueType`:
  excel.ValueType = {
    Null: 0,
    Merge: 1,
    Number: 2,
    String: 3,
    Date: 4,
    Hyperlink: 5,
    Formula: 6,
    SharedString: 7,
    RichText: 8,
    Boolean: 9,
    Error: 10
  }
  For instance, `cell.type = 2` is `excel.ValueType.Number`
*/

const valueCellTypes = [excel.ValueType.String, excel.ValueType.Number, excel.ValueType.Date, excel.ValueType.Boolean]

const isDataAList = data => {
  if (typeof data === 'object' && !Array.isArray(data) && data !== null) return false
  return true
}

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
        if (valueCellTypes.includes(cell.type) && cell.text.includes(value)) {
          cells.push(cell)
        }
      })
    })
  }
  return cells
}

const getMaxLimitPlaceHolders = () => [
  {
    placeholder: '<PerformanceTotalRecordLimit>',
    value: ({ data: { length = 0 }, total = 0 }) => {
      return total - length
    },
    condition: ({ data = [], total = 0 }) => data?.length === total,
    action: (cell, worksheet) => {
      if (cell) {
        cell.value = ''
        cell.style = null
        worksheet.unMergeCells(cell.address)
        worksheet.getRow(cell.row).height = 15.5 // Excel default height
      }
    },
  },
  {
    placeholder: '<PerformanceQueryLimit>',
    value: ({ data: { length = 0 } }) => {
      return length
    },
  },
]

// ----------------------------------------------------------------------------------------------
const getAdministrativeDivisionLabelPlaceHolders = async ({ partnerId }) => {
  const displayPreferences = await getDisplayPreferences({ partnerId })
  const getLabel = (name, defaultValue) => displayPreferences[name] || settings[name] || defaultValue

  return [
    {
      placeholder: '<StateLabel>',
      value: getLabel('stateLabel', 'State'),
    },
    {
      placeholder: '<StatesLabel>',
      value: getLabel('statesLabel', 'States'),
    },
    {
      placeholder: '<CountyLabel>',
      value: getLabel('countyLabel', 'County'),
    },
    {
      placeholder: '<CountiesLabel>',
      value: getLabel('countiesLabel', 'Counties'),
    },
    {
      placeholder: '<LgaLabel>',
      value: getLabel('lgaLabel', 'LGA'),
    },
    {
      placeholder: '<LgasLabel>',
      value: getLabel('lgasLabel', 'LGAs'),
    },
    {
      placeholder: '<SitesLabel>',
      value: getLabel('sitesLabel', 'Sites'),
    },
    {
      placeholder: '<AssaysLabel>',
      value: getLabel('assaysLabel', 'Assays'),
    },
  ]
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
function getBaseReplacements() {
  const replacements = [
    {
      placeholder: '<date>',
      value: format(new Date(), 'yyyy-MM-dd'),
    },
    {
      placeholder: '<Dates>',
      value: format(new Date(), 'yyyy-MM-dd'),
    },
  ]
  return replacements
}

// ----------------------------------------------------------------------------------------------
function getCellStyle(cell) {
  if (cell?.master) {
    return cell.master.style
  }
  return cell?.style
}

// ----------------------------------------------------------------------------------------------
function setCellStyle(cell, style) {
  cell.style = cell._mergeStyle(style, {}, {})
}

// ----------------------------------------------------------------------------------------------
function fillInSheetWithMap({ templateFolderPath, sheetIndex, dataSet, worksheet }) {
  let mapping
  try {
    mapping = require(`../../templates/${templateFolderPath}/mapping`) //eslint-disable-line
  } catch (error) {
    //
  }

  if (!mapping) return

  /**
   * sheetMap is an object with pattern { `cellAddress`: `fieldName` },
   * where `cellAddress` is cell address in general format like `B15` and
   * `fieldName` is a prop name in data object
   */
  const sheetMap = mapping[sheetIndex]

  if (sheetMap) {
    const { data } = dataSet[sheetIndex]
    if (!data) return

    _.keys(sheetMap).forEach(cellAddress => {
      const fieldName = sheetMap[cellAddress]
      const cell = worksheet.getCell(cellAddress)
      if (!cell) return

      /**
       * If report sheet has setting to set values only for empty cells, then
       * wrap below line with `if (cell.type === excel.ValueType.Null)`.
       *
       * Notice that `cell.type` may differ from `cell.effectiveType`. For instance,
       * for `cell.type = 6` (excel.ValueType.Formula) after setting numeric
       * value to depending cell
       * (which match possible Data Validation Rule defined for that depending cell in Excel)
       * actual `cell.effectiveType = 2` (excel.ValueType.Number)
       */

      cell.value = fieldName === null ? '' : data[fieldName]
    })

    worksheet.eachRow(row => {
      row.eachCell(cell => {
        if (cell.type === excel.ValueType.Formula) {
          /**
           * TODO: find some way to calculate formulas and set value to `cell.result`.
           * Otherwise - inform customers that when they open Excel file with formulas
           * which didn't calculate they should press Ctrl-Alt-F9 to auto-calculate all
           * such cells
           */
        }
      })
    })
  }
}

// ----------------------------------------------------------------------------------------------
function replacePlaceholders(worksheet, replacements, data) {
  // replace placeholders, i.e. <Dates>, <States>, etc in the header
  _.each(replacements, ({ placeholder, value, condition = () => false, action = () => true }) => {
    if (data && !_.isEmpty(data)) {
      if (condition(data)) {
        const [conditionalCell] = getCellsBySubstring(worksheet, placeholder)
        action(conditionalCell, worksheet)
      }
      if (_.isFunction(value)) {
        value = value(data)
      }
    }
    replaceSubstringInCell(worksheet, placeholder, value)
  })
}

// ----------------------------------------------------------------------------------------------
const addRowValuesAndCellStyle = (acc, cellValue) => {
  if (_.isPlainObject(cellValue)) {
    acc.rowValues = [...acc.rowValues, cellValue.value]
    acc.cellsStyle = [...acc.cellsStyle, cellValue.style || {}]
  } else {
    acc.rowValues = [...acc.rowValues, cellValue]
    // empty object for cell style
    acc.cellsStyle = [...acc.cellsStyle, {}]
  }
}

// ----------------------------------------------------------------------------------------------
async function renderExcelTemplate({
  countryAbbreviation,
  culture,
  data: dataSet, // i.e. data[0] is array of items for 1st sheet, data[1] for 2nd sheet, etc
  extension, // xlsx
  replacements = [],
  templateFolderPath,
  dataSelector,
}) {
  const lang = culture.split('-')[0].toLowerCase()
  // read file into workbook as ExcelWorkbook
  const workbook = await readTemplateFile(templateFolderPath, {
    lang,
    langDefault: LANG_DEFAULT,
    countryAbbreviation,
  })

  // get worksheets with specified in API way, 'workbook.worksheets' also works but not specified in API
  const worksheets = []
  workbook.eachSheet(worksheet => {
    worksheets.push(worksheet)
  })

  // process all sheets
  _.each(worksheets, async (worksheet, sheetIndex) => {
    const dataForSheet = dataSet[sheetIndex] || {}
    const {
      data,
      dynamicColumns = [],
      defaultNoDataMessage,
      dataSelector: dataSelectorSheet,
      // populator is a special function to populate current sheet
      populator,
    } = dataForSheet
    // define sections on a sheet
    let { sections } = dataForSheet
    const isListWithSections = !!sections
    if (!sections || _.isEmpty(sections)) {
      sections = [{}]
    }
    if (sections) {
      _.forEach(sections, section => {
        section.tableToken = section.dataSource ? `<Table-${section.dataSource}>` : '<Table>'
      })
    }

    const wayToFillInData = isListWithSections || isDataAList(data) ? 'list' : 'mapping'

    if (extension === 'csv' && (sheetIndex > 0 || wayToFillInData !== 'list')) {
      return
    }

    if (populator) {
      /**
       * if populator is defined then it handles all rendering/generation/replacements
       * by it's own, so after it finishes - exit from here
       */
      populator({
        dataForSheet,
        templateFolderPath,
        dataSet,
        replacements,
        sheetIndex,
        worksheet,
      })
      return
    }

    if (wayToFillInData === 'mapping') {
      // populate worksheet and exit this loop
      fillInSheetWithMap({
        templateFolderPath,
        sheetIndex,
        dataSet,
        worksheet,
      })
    }

    // replace placeholders, i.e. <Dates>, <States>, etc in the header
    replacePlaceholders(worksheet, replacements, dataForSheet)

    _.forEach(sections, section => {
      const { tableToken, dataSource: sectionDataSource } = section
      // position cell where data table begins
      const tableTokenCells = getCellsByValue(worksheet, tableToken)
      if (tableTokenCells.length > 0) {
        // empty cells
        tableTokenCells.forEach(cell => {
          cell.value = ''
        })

        if (!data) return

        // use 1st cell only (actually, should not be more than one)
        const cellTableToken = tableTokenCells[0]

        const allHeaderRows = getHeaderRows(worksheet, cellTableToken)
        const patternRowStart = cellTableToken.row + 1 + allHeaderRows.length
        const patternRows = []

        const firstPatternCell = worksheet.getCell(patternRowStart, 1)

        const { rowStart: firstPatternCellStartRowIndex, rowEnd: firstPatternCellEndRowIndex } =
          getCellDimensions(firstPatternCell)
        for (let i = firstPatternCellStartRowIndex; i <= firstPatternCellEndRowIndex; i++) {
          patternRows.push(worksheet.getRow(i))
        }
        const fixedColumnsCount = allHeaderRows[0].cellCount
        if (dynamicColumns.length > 0) {
          const dynamicMerges = appendColumnsToHeader(worksheet, dynamicColumns, allHeaderRows[0], allHeaderRows.length)
          _.forEach(dynamicMerges, range => {
            worksheet.mergeCells(range)
          })
        }

        const dataRows = wayToFillInData === 'mapping' ? data.rows : sectionDataSource ? data[sectionDataSource] : data

        if (dataRows && dataRows.length > 0) {
          // Step 1: Capture formulas and tokens
          const patternRowsMetadata = []
          patternRows.forEach(templateRow => {
            // Capture formulas, tokens and values, as templateRow will be mutated
            const rowMetadata = []
            templateRow.eachCell({ includeEmpty: true }, cell => {
              if (cell.type === excel.ValueType.Formula) {
                rowMetadata.push({ formula: cell.value.formula })
              } else if (typeof cell.value === 'string' && /^\s*<.+>\s*$/.test(cell.value)) {
                rowMetadata.push({ field: cell.value.match(/^<(.+)>$/)[1], isToken: true })
              } else {
                rowMetadata.push({ value: cell.value })
              }
            })
            patternRowsMetadata.push(rowMetadata)
          })

          // Step 2: Insert rows and apply data properly
          dataRows.forEach((dataRow, rowIndex) => {
            const mergesToAdd = []
            patternRows.forEach((templateRow, templateRowIndex) => {
              const currentRowIndex = patternRowStart + rowIndex * patternRows.length + templateRowIndex
              const newRow = worksheet.getRow(currentRowIndex) // Row creation
              newRow.height = templateRow.height // Maintain row height

              templateRow.eachCell({ includeEmpty: true }, (templateCell, colIndex) => {
                const newCell = newRow.getCell(colIndex)
                setCellStyle(newCell, getCellStyle(templateCell))

                // Collect cells to merge, only in the first row of each data block
                // (The actual merging is done at the end)
                if (templateCell.isMerged && patternRowStart !== currentRowIndex && templateRowIndex === 0) {
                  // Only process merge once from the master cell
                  const { rowStart, rowEnd, colStart, colEnd } = getCellDimensions(templateCell)
                  const rowSpan = rowEnd - rowStart + 1
                  const rowOffset = currentRowIndex - templateCell.row

                  const newMergeRange = {
                    top: rowStart + rowOffset,
                    left: colStart,
                    bottom: rowStart + rowOffset + rowSpan - 1,
                    right: colEnd,
                  }

                  mergesToAdd.push(newMergeRange)
                }
                const templateCellMetadata = patternRowsMetadata[templateRowIndex][colIndex - 1]
                // Process formula cells
                if (templateCellMetadata.formula) {
                  newCell.value = {
                    formula: templateCellMetadata.formula.replace(/(\$?[A-Za-z]+)(\$?\d+)/g, (_, colRef, rowRef) => {
                      if (rowRef.startsWith('$')) return `${colRef}${rowRef}`
                      const targetRow = parseInt(rowRef, 10)
                      const offset = currentRowIndex - templateCell.row
                      return `${colRef}${targetRow + offset}`
                    }),
                  }
                }
                // Process non-formula cells
                else if (templateCellMetadata.isToken) {
                  const newValue = getNewCellValue(dataRow, templateCellMetadata.field)
                  // complete here
                  newCell.value = newValue
                } else {
                  // mapping mode
                  newCell.value = templateCellMetadata.value
                }
              })

              // Process Dynamic columns, if they exist. Only in the first excel row of each data block.
              if (templateRowIndex === 0) {
                if (dynamicColumns.length > 0) {
                  let normalizedValues
                  const normalizer = dataSelector || dataSelectorSheet
                  if (normalizer) normalizedValues = normalizer(dataRow)
                  else normalizedValues = dataRow
                  /**
                   * helper func
                   */
                  const addValuesAndStyles = (acc, cellValue) => {
                    if (_.isArray(cellValue)) {
                      cellValue.forEach(cellVal => {
                        addRowValuesAndCellStyle(acc, cellVal)
                      })
                    } else {
                      addRowValuesAndCellStyle(acc, cellValue)
                    }
                  }

                  const dymamicColumnsValues = _.reduce(
                    dynamicColumns,
                    (acc, column) => {
                      const { subHeaders } = column
                      const hasSubHeaders = subHeaders?.length > 0
                      if (hasSubHeaders && !column.key) {
                        subHeaders.forEach(subHeader => {
                          if (subHeader.key) {
                            const cellValue = normalizedValues[subHeader.key]
                            addValuesAndStyles(acc, cellValue)
                          }
                        })
                      } else {
                        const cellValue = normalizedValues[column.key]
                        addValuesAndStyles(acc, cellValue)
                      }
                      return acc
                    },
                    {
                      rowValues: [],
                      cellsStyle: [],
                    }
                  )
                  let colIndex = fixedColumnsCount + 1
                  // Apply values to dynamic colums for the row
                  for (let i = 0; i < dymamicColumnsValues.rowValues.length; i++) {
                    // if records spans across multiple rows
                    if (firstPatternCellStartRowIndex !== firstPatternCellEndRowIndex) {
                      const rowSpan = firstPatternCellEndRowIndex - firstPatternCellStartRowIndex + 1
                      const rowOffset = rowIndex * patternRows.length
                      const newMergeRange = {
                        top: firstPatternCellStartRowIndex + rowOffset,
                        left: colIndex,
                        bottom: firstPatternCellStartRowIndex + rowOffset + rowSpan - 1,
                        right: colIndex,
                      }
                      mergesToAdd.push(newMergeRange)
                    }

                    const newCell = newRow.getCell(colIndex)
                    const cellValue = dymamicColumnsValues.rowValues[colIndex - fixedColumnsCount - 1]
                    newCell.value = cellValue
                    colIndex += 1
                  }
                }
              }
            })

            // Apply merges after all cells are created
            mergesToAdd.forEach(range => {
              worksheet.mergeCells(range.top, range.left, range.bottom, range.right)
            })
          })
        } else {
          // No data case: Fill pattern row with default message
          patternRows.forEach(row => {
            row.eachCell({ includeEmpty: true }, (cell, colIndex) => {
              cell.value = colIndex === 1 ? defaultNoDataMessage : ''
              setCellStyle(cell, getCellStyle(row.getCell(colIndex)))
            })
          })
        }
      }
    })
  })

  // return binary buffer
  return extension === 'csv' ? workbook.csv.writeBuffer() : workbook.xlsx.writeBuffer()

  function getNewCellValue(dataRow, fieldName) {
    if (fieldName === '#') {
      return dataRow.id
    }
    let value = _.isNil(dataRow[fieldName]) ? '' : dataRow[fieldName]

    if (fieldName === 'patientAge' || value === 'null') {
      value = ''
    }

    return value
  }
}

// ----------------------------------------------------------------------------------------------
async function renderExcelTemplateToCsv({
  countryAbbreviation,
  culture,
  data: dataSet, // i.e. data[0] is array of items for 1st sheet, data[1] for 2nd sheet, etc
  replacements = [],
  templateFolderPath,
  dataSelector,
}) {
  const lang = culture.split('-')[0].toLowerCase()
  // read file into workbook as ExcelWorkbook
  const workbook = await readTemplateFile(templateFolderPath, {
    lang,
    langDefault: LANG_DEFAULT,
    countryAbbreviation,
  })

  const worksheet = workbook.worksheets[0]
  const worksheetData = dataSet[0]
  const { data = [], defaultNoDataMessage, dataSelector: dataSelectorSheet, dynamicColumns = [] } = worksheetData || {}

  /**
   * replace base placeholders, i.e. <Dates>, <States>, etc in the header
   */
  replaceBasePlaceholders(replacements, worksheet, worksheetData)

  /**
   * prepare table in worksheet, i.e.
   * append dynamic columns, get all predefined field names, get pattern row number
   */
  const { patternRowNumber, fieldNames, dynamicMerges, allHeaderRows } = prepareWorksheet(worksheet, dynamicColumns)

  /**
   * merge dynamically appended cells
   */
  _.forEach(dynamicMerges, range => {
    worksheet.mergeCells(range)
  })

  /**
   * get data to populate rows
   * 'rowsValues' is array of array, i.e. array of rows, and each array item is
   * array of cell values
   */
  const rowsValues = getNormalizedData({
    data,
    fieldNames,
    normalizer: dataSelector || dataSelectorSheet,
    dynamicColumns,
    defaultNoDataMessage,
  })

  /**
   * put headers in 1st row
   */
  if (allHeaderRows.length > 0) {
    // get all header values from last item of array allHeaderRows
    const headerRow = allHeaderRows[allHeaderRows.length - 1]
    const headerValues = []
    headerRow.eachCell(cell => {
      headerValues.push(cell.value)
    })
    worksheet.getRow(1).values = headerValues
  }
  /**
   * insert data
   */
  if (patternRowNumber !== -1) {
    // remove pattern row and insert data rows starting from row number `patternRowNumber`
    worksheet.spliceRows(patternRowNumber, 1, ...rowsValues)

    // remove all rows between 1st row and table body (remove table headers too)
    worksheet.spliceRows(2, patternRowNumber - 1 - 1)
  }

  // Insert Byte-order-marker (BOM) to specify UTF-8 encoding.
  // Without it, special characters will appear garbled when
  // opening the CSV in Excel (but will be fine when using a text editor)
  // More here: https://stackoverflow.com/a/11399444
  const firstCell = worksheet.getRow(1)?.getCell(1)
  if (firstCell) {
    // eslint-disable-next-line no-irregular-whitespace
    firstCell.value = `﻿${firstCell.value}`
  }

  // return binary buffer
  return workbook.csv.writeBuffer()
}

// ----------------------------------------------------------------------------------------------
async function streamExcelTemplate({
  stream,
  templateFolderPath,
  countryAbbreviation,
  culture,
  data: dataSet, // i.e. data[0] is array of items for 1st sheet, data[1] for 2nd sheet, etc
  replacements = [],
  dataSelector,
}) {
  const lang = culture.split('-')[0].toLowerCase()

  /**
   * read file into workbook as ExcelWorkbook
   */
  const workbookTemplate = await readTemplateFile(templateFolderPath, {
    lang,
    langDefault: LANG_DEFAULT,
    countryAbbreviation,
  })

  /**
   * create Excel Workbook which will write to `stream`
   */
  const workbook = new excel.stream.xlsx.WorkbookWriter({
    stream,
    useStyles: true,
    useSharedStrings: true,
  })

  /**
   * get all sheets
   * Notice that we can not loop `workbookTemplate.eachSheet` directly, because
   * `iteratee` in `eachSheet` runs as `iteratee(sheet, sheet.id)` in exceljs,
   * but we need sheet index as 2nd param, not `sheet.id`.
   * `sheetIndex` is needed for `const worksheetData = data[sheetIndex]`, see below
   */
  const templateWorksheets = []
  workbookTemplate.eachSheet(worksheet => {
    templateWorksheets.push(worksheet)
  })

  /**
   * process all sheets
   */
  _.each(templateWorksheets, (worksheetTemplate, sheetIndex) => {
    const worksheetData = dataSet[sheetIndex]
    const {
      data = [],
      defaultNoDataMessage,
      dataSelector: dataSelectorSheet,
      dynamicColumns = [],
    } = worksheetData || {}
    /**
     * replace base placeholders, i.e. <Dates>, <States>, etc in the header
     */
    replaceBasePlaceholders(replacements, worksheetTemplate, worksheetData)

    /**
     * create worksheet with same model as in template
     */
    const worksheet = workbook.addWorksheet(worksheetTemplate.name, {
      ...worksheetTemplate.model,
      useSharedStrings: true,
    })

    /**
     * set width and formatting for columns
     */
    worksheet.columns = worksheetTemplate.columns

    let patternRowNumber = -1
    let fieldNames = []
    let dynamicMerges = []

    const wayToFillInData = isDataAList(data) ? 'list' : 'mapping'

    const dataRows = wayToFillInData === 'list' ? data : data.rows

    if (wayToFillInData === 'mapping') {
      /**
       * for mapping mode - populate worksheet template
       */
      fillInSheetWithMap({
        templateFolderPath,
        sheetIndex, // is needed to get correct item from `mapping` array
        dataSet,
        worksheet: worksheetTemplate,
      })
    }

    if (dataRows) {
      /**
       * prepare table in worksheet, i.e.
       * append dynamic columns, get all predefined field names, get pattern row number
       */
      ;({ patternRowNumber, fieldNames, dynamicMerges } = prepareWorksheet(worksheetTemplate, dynamicColumns))
    }

    /**
     * * get data to populate rows
     * 'rowsValues' is array of array, i.e. array of rows, and each array item is
     * array of cell values
     */
    let rowsValues = []
    if (dataRows) {
      rowsValues = getNormalizedData({
        data: dataRows,
        fieldNames,
        normalizer: dataSelector || dataSelectorSheet,
        dynamicColumns,
        defaultNoDataMessage,
      })
    }

    /**
     * all ranges for merged cells
     */
    const allRanges = [...worksheetTemplate.model.merges, ...dynamicMerges].map(rng => {
      const range = new Range(rng)
      // shift down all ranges below table
      if (patternRowNumber !== -1 && range.top > patternRowNumber) {
        range.top += rowsValues.length - 1
        range.bottom += rowsValues.length - 1
      }
      return range
    })

    /**
     * set all merges - for original cells on worksheetTemplate and for
     * dynamically appended cells if table header consists of more than 1 row
     */
    _.forEach(allRanges, range => {
      worksheet.mergeCells(range)
    })

    /**
     * need to clear pattern row because by default we copy values from any template cells
     * to new row in destination streamed worksheet, and in case when data is empty for the table
     * we don't want to see pattern tokens
     */
    if (patternRowNumber !== -1) {
      worksheetTemplate.getRow(patternRowNumber).eachCell(cell => {
        cell.value = null
      })
    }

    /**
     * Notice that `worksheet.rowCount` and `worksheet.actualRowCount` may differ
     * (rowCount >= actualRowCount) when worksheet has some gaps in rows definitions.
     * Because of that do not use `worksheet.eachRow` which iterates only
     * through actual rows - i.e. row3.number=3 and next actual row4 may have number=5
     * because real row4 was not defined (and is empty in Excel) and `eachRow`
     * returned array with only actually defined rows.
     * We need here all rows to correctly
     * increment `rowNumber` and make sure it is in line with rowTemplate.number.
     */
    let rowNumber = 1
    _.range(worksheetTemplate.rowCount).forEach(templateRowIndex => {
      /**
       * use `findRow` to get either actual row or `undefined`.
       * do not use `getRow` because it creates row if it doesn't exist
       * and we don't need to create new rows in `worksheetTemplate` here.
       */
      const rowTemplate = worksheetTemplate.findRow(templateRowIndex + 1)
      if (!rowTemplate) {
        rowNumber += 1 // point to the next row
        return
      }

      let payload = {
        rowNumber,
        rowTemplate,
        worksheet,
      }

      if (dataRows && rowNumber === patternRowNumber) {
        /**
         * insert all data rows to the streamed worksheet
         */
        _.each(rowsValues, values => {
          /**
           * `values` is array with values for each cell
           * Process `values` and handle all items which are plain objects,
           * in which case such objects must have prop `value` and may have
           * optional prop `style` to apply to particular cell
           */
          const rowData = _.reduce(
            values,
            (acc, cellValue) => {
              if (_.isArray(cellValue)) {
                cellValue.forEach(cellVal => {
                  addRowValuesAndCellStyle(acc, cellVal)
                })
              } else {
                addRowValuesAndCellStyle(acc, cellValue)
              }
              return acc
            },
            {
              rowValues: [],
              cellsStyle: [],
            }
          )
          // prepare base payload for current row
          payload = {
            ...payload,
            rowNumber,
            // add here props `rowValues` and `cellsStyle`
            ...rowData,
          }
          writeRowToStream(payload)
          // for big data sources log checkpoint after each 500 inserted rows
          if (rowNumber % 500 === 0) {
            logger.debug(`processed Excel rows: ${rowNumber}`, RELABEL_EXCEL)
          }
          rowNumber += 1
        })
      } else {
        writeRowToStream(payload)
        rowNumber += 1
      }
    })

    /**
     * must commit to flush worksheet to the stream
     */
    worksheet.commit()
  })
  /**
   * return uncommitted workbook - it will be committed in caller func
   */
  return workbook
}

// ----------------------------------------------------------------------------------------------
function writeRowToStream({ worksheet, rowNumber, rowTemplate, rowValues, cellsStyle }) {
  /**
   * get/create row
   */
  const row = worksheet.getRow(rowNumber)
  /**
   * set row props and style
   */
  row.height = rowTemplate.height
  row.hidden = rowTemplate.hidden
  row.outlineLevel = rowTemplate.outlineLevel || 0
  row.style = rowTemplate.style
  /**
   * create streaming cells from template row.
   * Notice that we are getting all cells from template, including
   * undefined (empty) - need this to correctly set styles
   */
  rowTemplate.eachCell({ includeEmpty: true }, cellTemplate => {
    const cell = row.getCell(cellTemplate.col)
    if (!cellTemplate.isMerged || cellTemplate === cellTemplate.master) {
      if (cellTemplate.type === excel.ValueType.Formula) {
        /**
         * when exceljs sets `cell.value = cellTemplate.value` with formula
         * then Excel may show error on opening such worksheet when
         * formula in cellTemplate.value is typed as shared and
         * has `formula` prop because formula is in merged cell, like
         * `{ formula: 'C23+F23', ref: 'L23', shareType: 'shared' }`.
         * For ordinal cells we have only `formula` prop, like `{ formula: 'C23+F23' }`.
         * Below we explicitly set cell.value only to `formula` prop for `master` cell
         * and skip using any other props from cellTemplate.value
         */
        const { formula } = cellTemplate
        if (formula) {
          cell.value = { formula }
        }
      } else {
        cell.value = cellTemplate.value
      }
    }
  })
  /**
   * overwrite values in cells if specified
   */
  if (rowValues) {
    row.values = rowValues
  }

  /**
   * set style
   * Notice that we are getting all cells from template, including
   * undefined (empty) - need this to correctly set styles
   */
  rowTemplate.eachCell({ includeEmpty: true }, cellTemplate => {
    const cell = row.getCell(cellTemplate.col)
    const cellStyle = _.merge(
      {},
      rowTemplate.style,
      cellTemplate.master?.style,
      cellTemplate.style,
      cellsStyle ? cellsStyle[cell.col - 1] : {}
    )
    cell.style = cellStyle
  })

  /**
   * must commit all row changes to move it to the stream.
   * Notice that no changes possible in row and it's cells after commit.
   */
  row.commit()
}

function extendRowStyles(worksheet, styles, from, to) {
  for (let i = from; i < to; i++) {
    const row = worksheet.getRow(i)
    row.eachCell({ includeEmpty: true }, cell => {
      const cellStyle = _.merge({}, cell.master?.style, cell.style, styles[cell.col - 1] ?? {})
      cell.style = cellStyle
    })
  }
}

// ----------------------------------------------------------------------------------------------
function replaceBasePlaceholders(replacements, worksheetTemplate, worksheetData) {
  _.each(replacements, ({ placeholder, value, condition = () => false, action = () => true }) => {
    if (worksheetData) {
      if (condition(worksheetData)) {
        const [conditionalCell] = getCellsBySubstring(worksheetTemplate, placeholder)
        action(conditionalCell, worksheetTemplate)
      }
      if (_.isFunction(value)) {
        value = value(worksheetData)
      }
    }
    replaceSubstringInCell(worksheetTemplate, placeholder, value)
  })
}

// ----------------------------------------------------------------------------------------------
function prepareWorksheet(worksheetTemplate, dynamicColumns) {
  let patternRowNumber = -1
  const fieldNames = []
  let dynamicMerges = []
  let allHeaderRows = []

  // position cell where data table begins
  const tableTokenCells = getCellsByValue(worksheetTemplate, '<Table>')
  if (tableTokenCells.length > 0) {
    // empty cells with value '<Table>'
    tableTokenCells.forEach(cell => {
      cell.value = ''
    })

    // use 1st cell only (actually, should not be more than one)
    const cellTableToken = tableTokenCells[0]

    allHeaderRows = getHeaderRows(worksheetTemplate, cellTableToken)
    const headerRow = allHeaderRows[0]

    patternRowNumber = cellTableToken.row + 1 + allHeaderRows.length

    /**
     * define field names for data table for each column
     */
    const patternRow = worksheetTemplate.getRow(patternRowNumber)
    patternRow.eachCell(cell => {
      let v = _.trim(cell.value)
      if (v[0] === '<' && v[v.length - 1] === '>') {
        v = _.trim(v, '< >')
        fieldNames.push(v)
      } else {
        fieldNames.push('')
      }
    })

    /**
     * when specified - append dynamic columns to template worksheet
     */
    if (dynamicColumns.length > 0) {
      dynamicMerges = appendColumnsToHeader(worksheetTemplate, dynamicColumns, headerRow, allHeaderRows.length)
    }
  }

  return {
    patternRowNumber,
    fieldNames,
    dynamicMerges,
    allHeaderRows,
  }
}

// ----------------------------------------------------------------------------------------------
function getNormalizedData({ data, fieldNames, normalizer, dynamicColumns, defaultNoDataMessage }) {
  /**
   * fill in array 'rowsValues' - this is an array (item for each row)
   * of array (cell values for current row)
   */
  let rowsValues = []
  if (data.length > 0) {
    rowsValues = data.map((dataRow, rowIndex) => {
      const normalizedValues = normalizer ? normalizer(dataRow) : dataRow
      const valuesInPredefinedColumns = fieldNames.map(fieldName => {
        if (fieldName === '#') {
          return rowIndex + 1
        }
        let value = fieldName && normalizedValues[fieldName]
        value = _.isNil(value) ? '' : value
        // TODO: think on a better generic way to handle such replacements in dataset
        if (fieldName === 'patientAge' || value === 'null') {
          value = ''
        }
        return value
      })

      let valuesInDynamicColumns = []
      if (dynamicColumns.length > 0) {
        valuesInDynamicColumns = _.reduce(
          dynamicColumns,
          (acc, column) => {
            const { subHeaders } = column
            const hasSubHeaders = subHeaders?.length > 0
            if (hasSubHeaders && !column.key) {
              subHeaders.forEach(subHeader => {
                if (subHeader.key) {
                  let value = normalizedValues[subHeader.key]
                  value = _.isUndefined(value) ? null : value
                  acc = [...acc, value]
                }
              })
            } else {
              let value = normalizedValues[column.key]
              value = _.isUndefined(value) ? null : value
              acc = [...acc, value]
            }
            return acc
          },
          []
        )
      }
      return [...valuesInPredefinedColumns, ...valuesInDynamicColumns]
    })
  } else {
    rowsValues = [
      fieldNames.map((fieldName, fieldIndex) => {
        const value = fieldIndex === 0 ? defaultNoDataMessage : ''
        return value
      }),
    ]
  }
  return rowsValues
}

// ----------------------------------------------------------------------------------------------
async function exportData(request, reply, sheetData, scope, options) {
  const { auth } = request
  const extension = request.query.format || 'xlsx'

  const { countryAbbreviation, culture } = await getUser(auth.credentials.name)
  const dataBuffer = await renderExcelTemplate({
    countryAbbreviation,
    culture,
    templateFolderPath: `export/${scope}`,
    data: [sheetData],
    extension,
    ...options,
  })
  return respondFile({ dataBuffer, extension, fileNamePrefix: scope, reply })
}

// ----------------------------------------------------------------------------------------------
function appendColumnsToHeader(worksheet, columns, headerRow, totalHeaderRows) {
  const getRowInfo = row => {
    const lastCellNumber = row.cellCount
    const lastCellStyle = getCellStyle(row.getCell(lastCellNumber))
    return {
      lastCellNumber,
      lastCellStyle,
    }
  }
  const patternRow = worksheet.getRow(headerRow.number + totalHeaderRows)
  const headerInfo = getRowInfo(headerRow)
  const patternInfo = getRowInfo(patternRow)
  const merges = []
  // start from column next after the last defined (real) column
  let columnNumber = headerInfo.lastCellNumber + 1
  columns.forEach(column => {
    if (column.width) {
      worksheet.getColumn(columnNumber).width = column.width
    }
    const hasSubHeaders = column.subHeaders?.length > 0
    const numMergeX = hasSubHeaders ? column.subHeaders.length : 1

    const cell = headerRow.getCell(columnNumber)
    cell.value = column.header
    /**
     * style cell in main header row
     */
    setCellStyle(cell, headerInfo.lastCellStyle)
    /**
     * merge cells for header when there are subHeaders available
     */
    if (hasSubHeaders) {
      const cell2 = headerRow.getCell(cell.col + numMergeX - 1)
      cell2.value = column.header
      setCellStyle(cell2, headerInfo.lastCellStyle)
      merges.push(`${cell.address}:${cell2.address}`)
    }
    /**
     * Set other rows/cells in a header if it has more than 1 row.
     * We start from next row (j = 1) meaning that we skip this
     * loop when totalHeaderRows = 1
     */
    for (let j = 1; j < totalHeaderRows; j++) {
      const row2 = worksheet.getRow(cell.row + j)
      if (hasSubHeaders) {
        column.subHeaders.forEach(({ text }, index) => {
          const cell2 = row2.getCell(cell.col + index)
          cell2.value = text
          setCellStyle(cell2, headerInfo.lastCellStyle)
        })
      } else {
        const cell2 = row2.getCell(cell.col)
        merges.push(`${cell.address}:${cell2.address}`)
        setCellStyle(cell2, headerInfo.lastCellStyle)
      }
    }
    /**
     * style cell in pattern row (with field name placeholders)
     */
    const cellPattern = patternRow.getCell(columnNumber)
    const cellStyle = patternInfo.lastCellStyle ? { ...patternInfo.lastCellStyle, numFmt: null } : null
    setCellStyle(cellPattern, cellStyle)
    if (hasSubHeaders) {
      const cell2 = patternRow.getCell(columnNumber + numMergeX - 1)
      setCellStyle(cell2, cellStyle)
    }

    /**
     * increase pointer to column for next loop
     */
    columnNumber += hasSubHeaders ? column.subHeaders.length : 1
  })

  return merges
}

/**
 * Get the area dimensions of a cell range, handling merged cells
 * @param {Object} range - The cell range to get dimensions for
 * @typedef {Object} RangeArea
 * @property {number} colStart - The starting column number of the range
 * @property {number} colEnd - The ending column number of the range
 * @property {number} rowStart - The starting row number of the range
 * @property {number} rowEnd - The ending row number of the range
 * @property {number} cols - The total number of columns in the range (colEnd - colStart + 1)
 * @property {number} rows - The total number of rows in the range (rowEnd - rowStart + 1)
 * @returns {RangeArea} Object containing the dimensions and boundaries of the cell range
 */
function getCellDimensions(range) {
  const startCell = range
  let endCell = range
  if (range.isMerged) {
    const [, { $b$r }] = Object.entries(range.worksheet._merges).find(([, r]) => r.$t$l === range.$col$row)
    endCell = range.worksheet.getCell($b$r)
  }

  const colStart = startCell.col
  const rowStart = startCell.row
  const colEnd = endCell.col
  const rowEnd = endCell.row

  return {
    colStart,
    colEnd,
    rowStart,
    rowEnd,
    cols: colEnd - colStart + 1,
    rows: rowEnd - rowEnd + 1,
  }
}

// ----------------------------------------------------------------------------------------------
module.exports = {
  exportData,
  getBaseReplacements,
  getMaxLimitPlaceHolders,
  getAdministrativeDivisionLabelPlaceHolders,
  getCellsBySubstring,
  getCellsByValue,
  readExcelFile,
  renderExcelTemplate,
  renderExcelTemplateToCsv,
  replacePlaceholders,
  streamExcelTemplate,
  RELABEL_EXCEL,
  setCellStyle,
}
