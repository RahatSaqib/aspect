const _ = require('lodash')
const { format } = require('date-fns')
const excel = require('exceljs') // see https://www.npmjs.com/package/exceljs
const { getContentType, readExcelFile, readTemplateFile } = require('./io')
const { getUser } = require('../auth/service')
const logger = require('./logger')

const LANG_DEFAULT = 'en'
const RELABEL_EXCEL = { reLabel: 'aspect:report:excel' }

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

const valueCellTypes = [
  excel.ValueType.String,
  excel.ValueType.Number,
  excel.ValueType.Date,
  excel.ValueType.Boolean,
]

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
    value: ({ dataRows: { length = 0 }, total = 0 }) => {
      return total - length
    },
    condition: ({ dataRows: { length = 0 } = [], total = 0 }) =>
      length === total,
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
    value: ({ dataRows: { length = 0 } }) => {
      return length
    },
  },
]

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
function getContentDispositionFilename(fileNamePrefix, extension) {
  return `${fileNamePrefix}_${new Date().toISOString()}.${extension}`.replace(
    /:/g,
    '-'
  )
}

// ----------------------------------------------------------------------------------------------
async function respondFile({
  reply,
  dataBuffer,
  extension = 'xlsx',
  fileNamePrefix = 'report',
}) {
  const reportFileName = getContentDispositionFilename(
    fileNamePrefix,
    extension
  )
  return reply
    .response(dataBuffer)
    .encoding('binary')
    .type(getContentType(extension))
    .header('content-disposition', `attachment; filename=${reportFileName};`)
}

// ----------------------------------------------------------------------------------------------
async function respondStream({
  reply,
  stream,
  extension = 'xlsx',
  fileNamePrefix = 'report',
}) {
  const reportFileName = getContentDispositionFilename(
    fileNamePrefix,
    extension
  )
  return reply
    .response(stream)
    .encoding('binary')
    .type(getContentType(extension))
    .header('content-disposition', `attachment; filename=${reportFileName};`)
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
  if (cell.master) {
    return cell.master.style
  }
  return cell.style
}

// ----------------------------------------------------------------------------------------------
function setCellStyle(cell, style) {
  if (!_.isEmpty(style)) {
    _.forEach(style, (styleValue, styleName) => {
      cell[styleName] = styleValue
    })
  }
}

// ----------------------------------------------------------------------------------------------
function fillInSheetWithMap({
  templateFolderPath,
  sheetIndex,
  data,
  worksheet,
}) {
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
    const { dataRows: dat } = data[sheetIndex]
    if (!dat) return

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
      cell.value = dat[fieldName]
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
async function renderExcelTemplate({
  culture,
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
    const {
      dataRows,
      dynamicColumns = [],
      defaultNoDataMessage,
      dataSelector: dataSelectorSheet,
    } = data[sheetIndex] || {}

    const wayToFillInData = _.isPlainObject(dataRows) ? 'mapping' : 'list'
    if (extension === 'csv' && (sheetIndex > 0 || wayToFillInData !== 'list')) {
      return
    }

    if (wayToFillInData === 'mapping') {
      // populate worksheet and exit this loop
      return fillInSheetWithMap({
        templateFolderPath,
        sheetIndex,
        data,
        worksheet,
      })
    }

    // replace placeholders, i.e. <Dates>, <States>, etc in the header
    _.each(
      replacements,
      ({
        placeholder,
        value,
        condition = () => false,
        action = () => true,
      }) => {
        if (data[sheetIndex]) {
          if (condition(data[sheetIndex])) {
            const [conditionalCell] = getCellsBySubstring(
              worksheet,
              placeholder
            )
            action(conditionalCell, worksheet)
          }
          if (_.isFunction(value)) {
            value = value(data[sheetIndex])
          }
        }
        replaceSubstringInCell(worksheet, placeholder, value)
      }
    )

    // position cell where data table begins
    const tableTokenCells = getCellsByValue(worksheet, '<Table>')

    if (tableTokenCells.length > 0) {
      // empty cells
      tableTokenCells.forEach(cell => {
        cell.value = ''
      })

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
      if (dynamicColumns.length > 0) {
        addColumnsToHeader(
          worksheet,
          dynamicColumns,
          headerRow,
          allHeaderRows.length
        )
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
            // TODO: think on a better generic way to handle such replacements in dataset
            // TODO: see Jira task for this - https://ops.systemone.id/browse/ASP-1450
            if (fieldName === 'patientAge' && value === 'null') {
              value = ''
            }
            return value
          })
          let valuesInDynamicColumns = []
          if (dynamicColumns.length > 0) {
            let normalizedValues
            const normalizer = dataSelector || dataSelectorSheet
            if (normalizer) normalizedValues = normalizer(dataRow)
            else normalizedValues = dataRow
            valuesInDynamicColumns = dynamicColumns.map(
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
      const fillRows = async rows =>
        worksheet.spliceRows(patternRowNumber, 1, ...rows)
      await fillRows(rows)
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
async function renderExcelTemplateToCsv({
  culture,
  data, // i.e. data[0] is array of items for 1st sheet, data[1] for 2nd sheet, etc
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

  const worksheet = workbook.worksheets[0]
  const worksheetData = data[0]
  const {
    dataRows = [],
    defaultNoDataMessage,
    dataSelector: dataSelectorSheet,
    dynamicColumns = [],
  } = worksheetData || {}

  /**
   * replace base placeholders, i.e. <Dates>, <States>, etc in the header
   */
  replaceBasePlaceholders(replacements, worksheet, worksheetData)

  /**
   * prepare table in worksheet, i.e.
   * append dynamic columns, get all predefined field names, get pattern row number
   */
  const { patternRowNumber, fieldNames, dynamicMerges, allHeaderRows } =
    prepareWorksheet(worksheet, dynamicColumns)

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
    dataRows,
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

  // return binary buffer
  return workbook.csv.writeBuffer()
}

// ----------------------------------------------------------------------------------------------
async function streamExcelTemplate({
  stream,
  templateFolderPath,
  culture,
  data, // i.e. data[0] is array of items for 1st sheet, data[1] for 2nd sheet, etc
  replacements = [],
  dataSelector,
}) {
  const lang = culture.split('-')[0].toLowerCase()

  /**
   * read file into workbook as ExcelWorkbook
   */
  const workbookTemplate = await readTemplateFile(
    templateFolderPath,
    lang,
    LANG_DEFAULT
  )

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
    const worksheetData = data[sheetIndex]
    const {
      dataRows = [],
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
    const worksheet = workbook.addWorksheet(
      worksheetTemplate.name,
      worksheetTemplate.model
    )

    /**
     * set width and formatting for columns
     */
    worksheet.columns = worksheetTemplate.columns

    /**
     * prepare table in worksheet, i.e.
     * append dynamic columns, get all predefined field names, get pattern row number
     */
    const { patternRowNumber, fieldNames, dynamicMerges } = prepareWorksheet(
      worksheetTemplate,
      dynamicColumns
    )

    /**
     * set all merges - for original cells on worksheetTemplate and for
     * dynamically appended cells if table header consists of more than 1 row
     */
    _.forEach([...worksheetTemplate.model.merges, ...dynamicMerges], range => {
      worksheet.mergeCells(range)
    })

    /**
     * * get data to populate rows
     * 'rowsValues' is array of array, i.e. array of rows, and each array item is
     * array of cell values
     */
    const rowsValues = getNormalizedData({
      dataRows,
      fieldNames,
      normalizer: dataSelector || dataSelectorSheet,
      dynamicColumns,
      defaultNoDataMessage,
    })

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
      let templateCells = []
      rowTemplate.eachCell(cellTemplate => {
        templateCells = [...templateCells, cellTemplate]
      })
      const payload = {
        worksheet,
        templateCells,
        /**
         * overwrite model.number because when we assign
         * template model to new row model `row.model = rowModel`
         * later in `writeRowToStream()`, row numbers should be equal
         * (row.model.number === rowModel.number)
         * otherwise exceljs throws error 'Invalid row number in model'
         */
        rowModel: { ...rowTemplate.model, number: rowNumber },
      }

      if (rowNumber === patternRowNumber) {
        /**
         * insert all data rows to the streamed worksheet
         */
        _.each(rowsValues, values => {
          payload.rowModel.number = rowNumber
          payload.rowValues = values
          writeRowToStream(payload)
          // for big data sources log checkpoint after each 500 inserted rows
          if (rowNumber % 500 === 0) {
            logger.info(`processed Excel rows: ${rowNumber}`, RELABEL_EXCEL)
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
function writeRowToStream({ worksheet, templateCells, rowModel, rowValues }) {
  /**
   * get/create row
   */
  const row = worksheet.getRow(rowModel.number)
  /**
   * when template row model contains cells -
   * set all cells in target row with their styles and values
   */
  if (rowModel.cells) {
    row.model = rowModel
  }
  /**
   * overwrite values in cells if specified
   */
  if (rowValues) {
    row.values = rowValues
  }
  /**
   * style cells
   */
  _.each(templateCells, cellTemplate => {
    const cell = row.getCell(cellTemplate.col)
    setCellStyle(cell, getCellStyle(cellTemplate))
  })
  /**
   * must commit all row changes to move it to the stream.
   * Notice that no changes possible in row and it's cells after commit.
   */
  row.commit()
}

// ----------------------------------------------------------------------------------------------
function replaceBasePlaceholders(
  replacements,
  worksheetTemplate,
  worksheetData
) {
  _.each(
    replacements,
    ({ placeholder, value, condition = () => false, action = () => true }) => {
      if (worksheetData) {
        if (condition(worksheetData)) {
          const [conditionalCell] = getCellsBySubstring(
            worksheetTemplate,
            placeholder
          )
          action(conditionalCell, worksheetTemplate)
        }
        if (_.isFunction(value)) {
          value = value(worksheetData)
        }
      }
      replaceSubstringInCell(worksheetTemplate, placeholder, value)
    }
  )
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
      dynamicMerges = appendColumnsToHeader(
        worksheetTemplate,
        dynamicColumns,
        headerRow,
        allHeaderRows.length
      )
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
function getNormalizedData({
  dataRows,
  fieldNames,
  normalizer,
  dynamicColumns,
  defaultNoDataMessage,
}) {
  /**
   * fill in array 'rowsValues' - this is an array (item for each row)
   * of array (cell values for current row)
   */
  let rowsValues = []
  if (dataRows.length > 0) {
    rowsValues = dataRows.map((dataRow, rowIndex) => {
      const valuesInPredefinedColumns = fieldNames.map(fieldName => {
        if (fieldName === '#') {
          return rowIndex + 1
        }
        let value = fieldName && dataRow[fieldName]
        value = _.isNil(value) ? '' : value
        // TODO: think on a better generic way to handle such replacements in dataset
        // TODO: see Jira task for this - https://ops.systemone.id/browse/ASP-1450
        if (fieldName === 'patientAge' && value === 'null') {
          value = ''
        }
        return value
      })
      let valuesInDynamicColumns = []
      if (dynamicColumns.length > 0) {
        let normalizedValues
        // const normalizer = dataSelector || dataSelectorSheet
        if (normalizer) normalizedValues = normalizer(dataRow)
        else normalizedValues = dataRow
        valuesInDynamicColumns = dynamicColumns.map(
          column => normalizedValues[column.key] || null
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
  columns.forEach((column, index) => {
    const columnNumber = headerInfo.lastCellNumber + 1 + index
    const cell = headerRow.getCell(columnNumber)
    cell.value = column.header
    /**
     * style cell in main header row
     */
    setCellStyle(cell, headerInfo.lastCellStyle)
    /**
     * set other rows/cells in a header if it has more than 1 row
     */
    for (let j = 1; j < totalHeaderRows; j++) {
      const row2 = worksheet.getRow(cell.row + j)
      const cell2 = row2.getCell(cell.col)
      merges.push(`${cell.address}:${cell2.address}`)
      setCellStyle(cell2, headerInfo.lastCellStyle)
    }
    /**
     * style cell in pattern row (with field name placeholders)
     */
    const cellPattern = patternRow.getCell(columnNumber)
    setCellStyle(cellPattern, patternInfo.lastCellStyle)
  })

  return merges
}

// ----------------------------------------------------------------------------------------------
module.exports = {
  exportData,
  getBaseReplacements,
  getMaxLimitPlaceHolders,
  getCellsBySubstring,
  getCellsByValue,
  readExcelFile,
  renderExcelTemplate,
  renderExcelTemplateToCsv,
  streamExcelTemplate,
  respondFile,
  respondStream,
  getContentDispositionFilename,
  RELABEL_EXCEL,
}
