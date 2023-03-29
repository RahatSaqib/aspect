const _ = require('lodash')
const { format, endOfMonth, startOfMonth, subMonths, addMonths } = require('date-fns')

const { addConstraints } = require('../../../auth/constraints')
const { knex, filterParams, filterDateRangeParams } = require('../../../db')
const { allAssayToId, allResultCategoryToId } = require('../../../shared/dictionary')
const { getCellsByValue, setCellStyle } = require('../../../shared/excel')
const {
  getMonthYearUserTimeZoneField,
  getOffsetFromIsoDateString,
  getLocalDateTimeStringInUtc,
} = require('../../../shared/date')
const { styleYellow, styles, styleSumRed } = require('./excelStyles')

// ---------------------------------------------------------------------------------------
const getFieldsForLine = (resultCategory, pulmonary, smear, historyKeys) => {
  const title = resultCategory?.value ? `# ${resultCategory.displayName}` : smear.title
  const items = _.map(historyKeys, historyKey => {
    const fieldName = `${pulmonary.name}${historyKey}${smear.name}${resultCategory?.fieldName || ''}`
    return {
      title,
      fieldName,
    }
  })
  return items
}
// ---------------------------------------------------------------------------------------
function getAllMonthsInRange(minDate, maxDate) {
  let allRanges = []
  let currentMonth = getLocalDateTimeStringInUtc(minDate)
  while (currentMonth <= getLocalDateTimeStringInUtc(maxDate)) {
    allRanges = [...allRanges, format(currentMonth, 'yyyy-MM')]
    currentMonth = addMonths(currentMonth, 1)
  }
  return allRanges
}

// ---------------------------------------------------------------------------------------
async function getXpertSiteDetailedReport(dataConstraints, query) {
  const now = new Date()
  const { minDate = startOfMonth(now), maxDate = endOfMonth(now) } = query
  let dateFrom = _.isString(minDate) ? new Date(minDate) : minDate
  const dateTo = _.isString(maxDate) ? new Date(maxDate) : maxDate
  if (dateFrom >= dateTo) {
    dateFrom = subMonths(dateTo, 1)
  }

  const offset = getOffsetFromIsoDateString(maxDate)

  /**
   * prepare all inclusive months in the range in format `yyyy-mm`.
   * This is needed to guarantee that report shows all requested months
   * in the column sections. When data doesn't have items for some month -
   * then all 0's will be displayed.
   */
  const allYearAndMonth = getAllMonthsInRange(minDate, maxDate)
  allYearAndMonth.sort()

  const assayIds = await allAssayToId()
  // const diseaseId = await diseaseToId('tb')
  const resultCategoryIds = await allResultCategoryToId()

  const customFields = require('../../../forms/formsDefinition/CustomFields_Pakistan.json')?.fields || []

  const abc = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  // remove space, '&', '-', '/' symbols
  const sanitizeName = text => text.replace(/[\s&-/]/g, '')
  const getCustomFieldValuesById = id => {
    const { items = [] } = customFields.find(x => x.id === id) || {}
    return _.map(items, ({ key, value }) => ({
      value,
      key,
      name: sanitizeName(`${key}`),
    }))
  }
  /*
  // "Previous History of TB Treatment" - Yes, No, Not Available ("id": 15)
  const historyItems = getCustomFieldValuesById(15)
  */
  // "Disease Site" - PTB, EPTB, PTBAndEPTB ("id": 10)
  let pulmonaryItems = getCustomFieldValuesById(10)
  // "AFB Smear Results" - Positive, Scanty, Negative, N/A ("id": 14)
  let smearItems = getCustomFieldValuesById(14)
  /*
  // "Repeat Test" - Yes, No ("id": 5)
  const repeatTestItems = getCustomFieldValuesById(5)
  */

  // ---------------------------------------------------------------------------------------
  // const allPulmonary = _.map(pulmonaryItems, it => it.value)
  pulmonaryItems = [
    ..._.map(pulmonaryItems, (pulmonary, index) => {
      return {
        ...pulmonary,
        title: `${abc[index]}. ${pulmonary.key} TB`,
      }
    }),
    {
      name: 'Unknown',
      key: 'Unknown TB',
      title: `${abc[pulmonaryItems.length]}. Unknown TB`,
    },
  ]
  const value2pulmonary = pulmonary => {
    const item = pulmonaryItems.find(it => it.value === pulmonary)
    if (item) {
      return item.name
    }
    return 'Unknown'
  }

  /**
   *
   */
  // const allSmear = _.map(smearItems, it => it.value)
  smearItems = _.map(smearItems, smear => {
    return {
      ...smear,
      title: smear.value === 'N/A' ? `# Smear Not Done/Not Available` : `# Smear ${smear.key}`,
    }
  })
  const value2smear = smear => {
    const item = smearItems.find(it => it.value === smear)
    if (item && smear !== 'N/A') {
      return item.name
    }
    return 'NA'
  }
  // ---------------------------------------------------------------------------------------
  const rc1 = {
    Detected: resultCategory1 => resultCategory1 === resultCategoryIds.Detected,
    Trace: resultCategory1 => resultCategory1 === resultCategoryIds['Trace Detected'],
    Rif: (resultCategory1, resultCategory2) =>
      resultCategory1 === resultCategoryIds.Detected && resultCategory2 === resultCategoryIds.Detected,
    NotDetected: resultCategory1 => resultCategory1 === resultCategoryIds.NotDetected,
    NA: resultCategory1 =>
      ![resultCategoryIds.Detected, resultCategoryIds.NotDetected, resultCategoryIds['Trace Detected']].includes(
        resultCategory1
      ),
  }
  const getResultCategoryField = (fieldName, condition, title) => ({ fieldName, condition, title })
  const resultCategories = [
    getResultCategoryField('Detected', rc1.Detected, '# MTB Detected (Excluding Trace)'),
    getResultCategoryField('Trace', rc1.Trace, '# MTB Trace'),
    getResultCategoryField('Rr', rc1.Rif, '# RR - detected'),
    getResultCategoryField('NotDetected', rc1.NotDetected, '# MTB Not Detected'),
    getResultCategoryField('Na', rc1.NA, '# Invalid/Error/No Result (Final Report NA)'),
  ]
  const value2resultCategory = (resultCategory1, resultCategory2) => {
    const item = resultCategories.find(it => it.condition(resultCategory1, resultCategory2))
    if (item) {
      return item.fieldName
    }
    return 'Na'
  }

  // ---------------------------------------------------------------------------------------
  const historyKeys = ['New', 'PreviouslyTreated', 'FollowUp', 'Unknown']
  const value2historyKey = (history, repeatTest) => {
    if (['0', 'No'].includes(history)) {
      return 'New'
    }
    if (['1', 'Yes'].includes(history)) {
      return 'PreviouslyTreated'
    }
    if (!['0', 'No', '1', 'Yes'].includes(history) && ['1', 'Yes'].includes(repeatTest)) {
      return 'FollowUp'
    }
    if (
      [null, undefined, 'Not Available', '-1'].includes(history) &&
      //
      !['1', 'Yes'].includes(repeatTest)
    ) {
      return 'Unknown'
    }
  }

  let topGroups = []
  let fields = {}

  /**
   * get raw data
   */
  const rawData = await knex('Result as r')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .innerJoin('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .leftOuterJoin('Site as s', 's.id', 'r.siteId')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .leftJoin('ResultCategoryAssay as rca1', function () {
      this.on('r.assayId', 'rca1.assayId').andOn('r.resultCategory1', 'rca1.resultCategoryId')
    })
    .leftJoin('ResultCategoryAssay as rca2', function () {
      this.on('r.assayId', 'rca2.assayId').andOn('r.resultCategory2', 'rca2.resultCategoryId')
    })
    // scope TB* assays
    .whereIn('a.id', [assayIds.GxMtbRif, assayIds.GxMtbRifUltra, assayIds.GxMtbXdr])
    .modify(addConstraints, dataConstraints, {
      device: 'd',
      site: 's',
      geography: 'g',
      assay: 'a',
      result: 'r',
    })
    // apply date range filter
    .modify(filterDateRangeParams, { minDate: dateFrom, maxDate: dateTo }, 'r.endedOn')
    // apply remaining filters
    .modify(filterParams, query, {
      countryId: 'g.countryId',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      siteName: 's.name',
    })
    // define field for grouping by it
    .select(
      getMonthYearUserTimeZoneField(knex, 'r.endedOn', 'yearAndMonth', offset),
      'r.resultCategory1',
      'r.resultCategory2',
      knex.raw(`(r.resultData ->> '$.customFieldData."10".value') as pulmonary`),
      knex.raw(`(r.resultData ->> '$.customFieldData."14".value') as smear`),
      knex.raw(`(r.resultData ->> '$.customFieldData."15".value') as history`),
      knex.raw(`(r.resultData ->> '$.customFieldData."5".value') as repeatTest`)
    )

  topGroups = []
  fields = []
  _.forEach(pulmonaryItems, pulmonary => {
    const topGroup = {
      title: pulmonary.title,
      titleRaw: pulmonary.key,
      style: styleYellow,
      source: pulmonary,
      children: [],
    }
    topGroups = [...topGroups, topGroup]

    //
    _.forEach(smearItems, smear => {
      const smearFields = getFieldsForLine(null, pulmonary, smear, historyKeys)
      fields = [...fields, ...smearFields]
      const smearSection = {
        title: smear.title,
        fields: smearFields,
        style: styles[smear.name],
        source: smear,
        children: [],
      }
      topGroup.children = [...topGroup.children, smearSection]
      _.forEach(resultCategories, resultCategory => {
        const categoryFields = getFieldsForLine(resultCategory, pulmonary, smear, historyKeys)
        fields = [...fields, ...categoryFields]
        const category = {
          title: resultCategory.title,
          fields: categoryFields,
          source: resultCategory,
        }
        smearSection.children = [...smearSection.children, category]
      })
    })
  })
  /**
   * object with all fields equal 0
   */
  const allFieldsZero = _.reduce(
    fields,
    (acc, field) => {
      acc = { ...acc, [field.fieldName]: 0 }
      return acc
    },
    {}
  )

  /**
   * prepare JSON object for adding all counts
   */
  let data = _.reduce(
    allYearAndMonth,
    (acc, yearAndMonth) => {
      acc[yearAndMonth] = { ...allFieldsZero }
      return acc
    },
    {}
  )
  /**
   * loop through all raw data and based on record values construct corresponding
   * fieldName to increase in the monthly-scoped object
   */
  _.forEach(rawData, dataItem => {
    const { yearAndMonth, resultCategory1, resultCategory2, pulmonary, smear, history, repeatTest } = dataItem

    const pulmonaryName = value2pulmonary(pulmonary)
    const historyKey = value2historyKey(history, repeatTest)
    const smearName = value2smear(smear)
    const resultCategoryName = value2resultCategory(resultCategory1, resultCategory2)

    let fieldName = `${pulmonaryName}${historyKey}${smearName}`
    if (fields.find(it => it.fieldName === fieldName)) {
      data[yearAndMonth][fieldName] += 1
    }

    fieldName = `${pulmonaryName}${historyKey}${smearName}${resultCategoryName}`
    if (fields.find(it => it.fieldName === fieldName)) {
      data[yearAndMonth][fieldName] += 1
    }
  })
  /**
   * convert json objects into an array
   */
  data = _.reduce(
    _.keys(data),
    (acc, yearAndMonth) => {
      acc = [...acc, { yearAndMonth, ...data[yearAndMonth] }]
      return acc
    },
    []
  )
  data = _.sortBy(data, ['yearAndMonth'])

  return {
    data: {
      topGroups,
      pulmonaryItems,
      smearItems,
      resultCategories,
      historyKeys,
      rangeData: data,
    },
    populator,
  }
}

// ----------------------------------------------------------------------------------
const setTableHeader = (worksheet, totalRanges, numColumnsPerMonth) => {
  const [cell] = getCellsByValue(worksheet, '<TableHeader>')
  cell.value = 'Xpert Implementation Site (XIS) Performance Report'
  const row = worksheet.getRow(cell.row)
  const endCol = cell.col + totalRanges * numColumnsPerMonth
  const range = `${cell.address}:${row.getCell(endCol).address}`
  worksheet.mergeCells(range)
}
// ----------------------------------------------------------------------------------
/**
 * function which generates Excel rows/cells and populates them with data and formulas
 */
const populator = ({ dataForSheet, worksheet }) => {
  const {
    data: { topGroups, smearItems, resultCategories, historyKeys, rangeData },
  } = dataForSheet

  const numColumnsPerMonth = historyKeys.length + 1

  const [cell] = getCellsByValue(worksheet, '<HeaderDateRange>')
  const anchor = {
    col: cell.col,
    row: cell.row,
    cell,
  }
  const rowHeader = worksheet.getRow(anchor.row)

  setTableHeader(worksheet, rangeData.length, numColumnsPerMonth)

  /**
   * helpers
   */
  // ----------------------------------------------------------
  const drawTotalForPulmonarySection = (ind, title, position) => {
    const curRow = worksheet.getRow(position.curRowNum)
    let curCell = curRow.getCell(1)
    curCell.value = title
    if (ind === -1) {
      curCell.style = styles.PulmonarySum
    }
    //
    for (let monthIndex = 0; monthIndex < rangeData.length; monthIndex++) {
      for (let jCol = 0; jCol < numColumnsPerMonth; jCol++) {
        const col = 2 + jCol + numColumnsPerMonth * monthIndex
        curCell = curRow.getCell(col)
        curCell.style = styleSumRed

        let sum = []
        for (let j = 0; j < smearItems.length; j++) {
          const prevRow = worksheet.getRow(curCell.row - (j + 1) * (resultCategories.length + 1))
          const prevCell = prevRow.getCell(col)
          sum = [...sum, prevCell.address]
        }
        curCell.value = { formula: sum.join('+') }
      }
    }
    position.curRowNum += 1
  }
  // ----------------------------------------------------------
  /**
   * drawGroup is used for showing yellow pulmonary items and nested smear groups
   */
  const drawGroup = (parent, position, skipTotals) => {
    for (let index = 0; index < parent.children.length; index++) {
      const item = parent.children[index]
      curRow = worksheet.getRow(position.curRowNum)
      curCell = curRow.getCell(1)
      curCell.value = item.title
      curCell.style = item.style
      //
      for (let monthIndex = 0; monthIndex < rangeData.length; monthIndex++) {
        const dataForMonth = rangeData[monthIndex]
        const { fields } = item
        if (fields) {
          let sum = []
          for (let jCol = 0; jCol < numColumnsPerMonth; jCol++) {
            const col = 2 + jCol + numColumnsPerMonth * monthIndex
            curCell = curRow.getCell(col)
            curCell.style = item.style
            if (jCol < numColumnsPerMonth - 1) {
              sum = [...sum, curCell.address]
              const field = fields[jCol]
              curCell.value = dataForMonth[field.fieldName]
            } else {
              curCell.value = { formula: sum.join('+') }
            }
          }
        }
      }
      position.curRowNum += 1

      if (item.children && item.children.length > 0) {
        drawGroup(item, position, true)
      }
    }
    /**
     * draw Total rows at the end of each pulmonary section
     */
    if (!skipTotals) {
      drawTotalForPulmonarySection(-1, `Total # ${parent.titleRaw} Tested`, position)
      for (let j = 0; j < resultCategories.length; j++) {
        drawTotalForPulmonarySection(j, resultCategories[j].title, position)
      }
    }
  }

  // ----------------------------------------------------------
  let curCell
  let curRow
  const position = {
    curRowNum: 1,
  }

  for (let monthIndex = 0; monthIndex < rangeData.length; monthIndex++) {
    const dataForMonth = rangeData[monthIndex]
    const startCol = anchor.col + numColumnsPerMonth * monthIndex
    const endCol = startCol + numColumnsPerMonth - 1
    const dateRangeHeader = dataForMonth.yearAndMonth

    const cellHeader = rowHeader.getCell(startCol)
    const range = `${cellHeader.address}:${rowHeader.getCell(endCol).address}`
    /**
     * Header cells
     */
    if (monthIndex > 0) {
      /**
       * month name header with merged cells
       */
      worksheet.mergeCells(range)
      setCellStyle(cellHeader, anchor.cell.style)
      /**
       * copy 5 cells for history columns in each month
       */
      curRow = worksheet.getRow(anchor.row + 1)
      for (let jCol = 0; jCol < numColumnsPerMonth; jCol++) {
        const startCol = anchor.col + numColumnsPerMonth * monthIndex
        const cellSrc = curRow.getCell(anchor.col + jCol)
        const cellDst = curRow.getCell(startCol + jCol)
        setCellStyle(cellDst, cellSrc.style)
        cellDst.value = cellSrc.value
      }
    }

    cellHeader.value = dateRangeHeader
  }

  position.curRowNum = anchor.row + 2

  for (let vertGroupIndex = 0; vertGroupIndex < topGroups.length; vertGroupIndex++) {
    const topGroup = topGroups[vertGroupIndex]
    curRow = worksheet.getRow(position.curRowNum)
    curCell = curRow.getCell(1)
    curCell.value = topGroup.title
    curCell.style = topGroup.style
    //
    for (let monthIndex = 0; monthIndex < rangeData.length; monthIndex++) {
      for (let jCol = 0; jCol < numColumnsPerMonth; jCol++) {
        const col = 2 + jCol + numColumnsPerMonth * monthIndex
        curCell = curRow.getCell(col)
        curCell.style = topGroup.style
      }
    }
    position.curRowNum += 1

    drawGroup(topGroup, position)
  }
}

module.exports = {
  getXpertSiteDetailedReport,
}
