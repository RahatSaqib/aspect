import { subDays, subMonths, getYear, subYears, startOfMonth, endOfMonth } from 'date-fns'
import { format } from 'date-fns-tz'
import filter from 'lodash/filter'
import flatten from 'lodash/flatten'
import get from 'lodash/get'
import includes from 'lodash/includes'
import isArray from 'lodash/isArray'
import isNil from 'lodash/isNil'
import isNull from 'lodash/isNull'
import map from 'lodash/map'
import nth from 'lodash/nth'
import omitBy from 'lodash/omitBy'
import pick from 'lodash/pick'
import round from 'lodash/round'
import startCase from 'lodash/startCase'
import sum from 'lodash/sum'
import uniqBy from 'lodash/uniqBy'
import values from 'lodash/values'
import { months } from '../../../messages/dateMessages'
import { customPropertiesVariables as colors } from '../../../theme/colors'
import {
  groupByKey,
  groupForPie,
  groupForPieRow,
  groupForDivergent,
  groupForInventoryStatusAPI,
  groupForOldTreatmentAPI,
  groupForPieOldTreatmentAPI,
  groupForDeviceStatusAPI,
  filterByMultiple,
} from '../grouping'
import { getMinMaxDateFromMonthString } from './getMinMaxDateFromMonthString'
import { getResultCategoryGroupsForResultList } from './getResultCategoryGroupsForResultList'
import { negateTimeZoneOffset } from './negateTimeZoneOffset'

const graphColorMap = [
  { id: 1, externalId: 'MoreThan1000', color: colors['--aspect-color-mandy'] },
  { id: 2, externalId: 'LessThan1000', color: colors['--web-orange'] },
  { id: 3, externalId: 'LessThan150', color: colors['--aspect-color-pink'] },
  { id: 4, externalId: 'LessThan40', color: colors['--golden-dream'] },
  { id: 5, externalId: 'MoreThan40', color: colors['--aspect-color-pink'] },
  { id: 6, externalId: 'Detected', color: colors['--aspect-color-mandy'] },
  { id: 7, externalId: 'Trace Detected', color: colors['--aspect-color-mandy-2'] },
  { id: 8, externalId: 'Indeterminate', color: colors['--aspect-color-pink'] },
  { id: 9, externalId: 'NotDetected', color: colors['--aspect-color-conifer'] },
  { id: 10, externalId: 'Invalid', color: colors['--dusty'] },
  { id: 11, externalId: 'NoResult', color: colors['--aspect-color-pink'] },
  { id: 12, externalId: 'Error', color: colors['--tundora'] },
  { id: 13, externalId: 'Positive', color: colors['--aspect-color-mandy'] },
  { id: 14, externalId: 'PresumptivePositive', color: colors['--aspect-color-mandy-2'] },
  { id: 15, externalId: 'Inconclusive', color: colors['--aspect-color-pink'] },
  { id: 16, externalId: 'Unknown', color: colors['--aspect-color-white-4'] },
  { id: 17, externalId: 'Negative', color: colors['--aspect-color-conifer'] },
  { id: 18, externalId: 'died', color: colors['--aspect-color-mandy'] },
  { id: 19, externalId: 'recovered', color: colors['--aspect-color-conifer'] },
  { id: 20, externalId: 'selfQuarantine', color: colors['--aspect-color-supernova-2'] },
  { id: 21, externalId: 'quarantine', color: colors['--aspect-color-supernova'] },
  { id: 22, externalId: 'Male', color: colors['--aspect-color-scooter-blue-4'] },
  { id: 23, externalId: 'Female', color: colors['--purple-mountains-majesty'] },
  { id: 24, externalId: 'Confirmed', color: colors['--aspect-color-conifer'] },
  { id: 25, externalId: 'NotConfirmed', color: colors['--aspect-color-scooter-blue-4'] },
  { id: 30, externalId: 'devicesActive', color: colors['--aspect-device-active'] },
  { id: 31, externalId: 'weekendOrHoliday', color: colors['--aspect-device-weekend'] },

  // color modifications for tbResultsByCategory1Monthly && NotDetected tbResultsByCategory1Aggregate
  { id: 7, externalId: 'Trace Detected_tbResultsByCategory1Monthly', color: colors['--aspect-color-crayola'] },
  { id: 9, externalId: 'NotDetected_tbResultsByCategory1Monthly', color: colors['--aspect-color-mint'] },
  { id: 11, externalId: 'NoResult_tbResultsByCategory1Monthly', color: colors['--aspect-color-slate'] },
  { id: 7, externalId: 'Trace Detected_tbResultsByCategory1Aggregate', color: colors['--aspect-color-crayola'] },
  { id: 9, externalId: 'NotDetected_tbResultsByCategory1Aggregate', color: colors['--aspect-color-mint'] },
  { id: 11, externalId: 'NoResult_tbResultsByCategory1Aggregate', color: colors['--aspect-color-slate'] },

  // color modifications for tbByCategory1Monthly && tbByCategory1Aggregate
  { id: 9, externalId: 'NotDetected_tbByCategory1Monthly', color: colors['--aspect-color-powder'] },
  { id: 9, externalId: 'NotDetected_tbByCategory1Aggregate', color: colors['--aspect-color-powder'] },

  // color modifications for covidByCategory1Monthly && covidByCategory1Aggregate
  { id: 11, externalId: 'NoResult_covidByCategory1Monthly', color: colors['--aspect-color-slate'] },
  { id: 16, externalId: 'Unknown_covidByCategory1Monthly', color: colors['--aspect-color-slate'] },
  { id: 17, externalId: 'Negative_covidByCategory1Monthly', color: colors['--aspect-color-mint'] },
  { id: 11, externalId: 'NoResult_covidByCategory1Aggregate', color: colors['--aspect-color-slate'] },
  { id: 16, externalId: 'Unknown_covidByCategory1Aggregate', color: colors['--aspect-color-slate'] },
  { id: 17, externalId: 'Negative_covidByCategory1Aggregate', color: colors['--aspect-color-mint'] },

  // for `inactive*` device statuses
  { id: 40, externalId: 'inactiveUnknown', color: colors['--aspect-device-inactiveUnknown'] },
  { id: 41, externalId: 'inactiveConnectivity', color: colors['--aspect-device-inactiveConnectivity'] },
  { id: 42, externalId: 'inactiveDecommissioned', color: colors['--aspect-device-inactiveDecommissioned'] },
  { id: 43, externalId: 'inactiveDownForRepair', color: colors['--aspect-device-inactiveDownForRepair'] },
  { id: 44, externalId: 'inactiveNoTestsPerformed', color: colors['--aspect-device-inactiveNoTestsPerformed'] },
  { id: 45, externalId: 'inactiveOutOfInventory', color: colors['--aspect-device-inactiveOutOfInventory'] },
  { id: 46, externalId: 'inactiveNoStaff', color: colors['--aspect-device-inactiveNoStaff'] },
  { id: 46, externalId: 'inactiveNoSamples', color: colors['--aspect-device-inactiveNoSamples'] },
  { id: 46, externalId: 'inactiveNoPower', color: colors['--aspect-device-inactiveNoPower'] },
  { id: 46, externalId: 'inactiveOther', color: colors['--aspect-device-inactiveOther'] },

  { id: 50, externalId: 'medianMarker', color: colors['--eastern-blue'] },
  { id: 60, externalId: 'percentPositive', color: colors['--aspect-color-mandy'] },
  { id: 61, externalId: 'percentReported', color: colors['--aspect-color-conifer'] },
  { id: 62, externalId: 'percentViaSms', color: colors['--aspect-color-conifer'] },
  { id: 63, externalId: 'percentViaEmail', color: colors['--aspect-color-conifer'] },
  { id: 64, externalId: 'percentWithin2Hours', color: colors['--aspect-color-conifer'] },
  { id: 70, externalId: 'cntAll', color: colors['--eastern-blue-2'] },
  { id: 71, externalId: 'cntPositive', color: colors['--aspect-color-mandy'] },
  { id: 80, externalId: 'noData', color: colors['--geyser'] },
  { id: 90, externalId: 'outOfStock', color: colors['--aspect-device-inactiveDownForRepair'] },
  { id: 91, externalId: 'upTo14', color: colors['--aspect-device-transfer-time'] },
  { id: 92, externalId: 'upTo30', color: colors['--aspect-device-transfer-time'] },
  { id: 93, externalId: 'upTo90', color: colors['--aspect-device-transfer-time'] },
  { id: 94, externalId: 'upTo180', color: colors['--aspect-device-transfer-time'] },
  { id: 95, externalId: 'moreThan180', color: colors['--aspect-device-transfer-time'] },
  { id: 96, externalId: 'notRecorded', color: colors['--aspect-device-inactiveUnknown'] },
  { id: 97, externalId: 'noConsumption', color: colors['--aspect-device-active'] },
  { id: 100, externalId: 'abbottM2000PlasmaHivVL', color: colors['--abbott-orange-1'] },
  { id: 101, externalId: 'abbottM2000PlasmaHbvVL', color: colors['--abbott-orange-2'] },
  { id: 102, externalId: 'abbottM2000DBSHivVl', color: colors['--abbott-orange-3'] },
  { id: 103, externalId: 'abbottM2000HivEid', color: colors['--abbott-orange-4'] },
  { id: 104, externalId: 'abbottM2000DaanNCOVID19', color: colors['--abbott-orange-5'] },

  { id: 121, externalId: 'QHivVl', color: colors['--loblolly'] },
  { id: 108, externalId: 'assayGenericCulture', color: colors['--regent-gray'] },
  { id: 129, externalId: 'assayCobasHivVl', color: colors['--rolling-stone'] },

  { id: 105, externalId: 'assayBdMgitAst', color: colors['--bd-gray-1'] },
  { id: 106, externalId: 'assayBdMgitGnd', color: colors['--bd-gray-2'] },

  { id: 110, externalId: 'assayGenoTypeMTBCV1', color: colors['--geno-lavender1'] },
  { id: 111, externalId: 'assayGenoTypeMTBDRplusV2', color: colors['--geno-lavender2'] },
  { id: 112, externalId: 'assayGenoTypeMTBDRslV1', color: colors['--geno-lavender3'] },
  { id: 113, externalId: 'assayGenoTypeMTBDRslV2', color: colors['--geno-lavender4'] },

  { id: 114, externalId: 'GxMtbRif', color: colors['--genex-blue1'] },
  { id: 115, externalId: 'GxMtbRifUltra', color: colors['--azure-radiance'] },

  { id: 116, externalId: 'GxHiv1Vl', color: colors['--genex-blue3'] },
  { id: 117, externalId: 'GxHiv1Qual', color: colors['--genex-blue4'] },
  { id: 118, externalId: 'GxEbola', color: colors['--genex-blue5'] },
  { id: 119, externalId: 'GxUnknown', color: colors['--genex-blue6'] },
  { id: 120, externalId: 'GxHcv', color: colors['--genex-blue7'] },
  { id: 121, externalId: 'GxMtbXdr', color: colors['--genex-blue8'] },

  { id: 124, externalId: 'assayAlereQHiv12Detect', color: colors['--alere-green1'] },
  { id: 125, externalId: 'assayAlereQHiv12VLPlasma', color: colors['--alere-green2'] },

  { id: 126, externalId: 'senaiteSmearMicroscopy', color: colors['--texas-rose'] },

  { id: 127, externalId: 'senaiteUnknown', color: colors['--chardonnay'] },
  { id: 128, externalId: 'senaiteTbCulture', color: colors['--frangipani'] },

  { id: 130, externalId: 'assayGenericDst', color: colors['--covid-green1'] },
  { id: 131, externalId: 'assayMP96Covid19', color: colors['--covid-green2'] },
  { id: 132, externalId: 'assayQS7Covid19', color: colors['--covid-green3'] },
  { id: 133, externalId: 'assayGXCovid19', color: colors['--covid-green4'] },
  { id: 134, externalId: 'assayGenericCovid19', color: colors['--covid-green5'] },
  { id: 135, externalId: 'value', color: colors['--san-marino'] },

  { id: 200, externalId: 'assayGeneXpertMtbRif', color: colors['--loblolly'] },
  { id: 201, externalId: 'assaySmear', color: colors['--regent-gray'] },
  { id: 202, externalId: 'assayLPA', color: colors['--hit-gray'] },
  { id: 204, externalId: 'assayTbLamp', color: colors['--rolling-stone'] },

  { id: 220, externalId: 'assayTruenatMtb', color: colors['--web-orange-2'] },
  { id: 221, externalId: 'assayTruenatRif', color: colors['--covid-green5'] },
  { id: 222, externalId: 'assayTruenatUnknown', color: colors['--web-orange'] },
  { id: 223, externalId: 'assayTruenatMtbPlus', color: colors['--malachite'] },

  { id: 301, externalId: '2010', color: colors['--covid-green1'] },
  { id: 301, externalId: '2011', color: colors['--aspect-color-mandy'] },
  { id: 302, externalId: '2012', color: colors['--web-orange'] },
  { id: 303, externalId: '2013', color: colors['--aspect-color-pink'] },
  { id: 304, externalId: '2014', color: colors['--golden-dream'] },
  { id: 305, externalId: '2015', color: colors['--bd-gray-1'] },
  { id: 306, externalId: '2016', color: colors['--aspect-color-conifer'] },
  { id: 307, externalId: '2017', color: colors['--aspect-color-mandy-2'] },
  { id: 308, externalId: '2018', color: colors['--aspect-color-crayola'] },
  { id: 309, externalId: '2019', color: colors['--eastern-blue-2'] },
  { id: 310, externalId: '2020', color: colors['--aspect-color-supernova'] },
  { id: 311, externalId: '2021', color: colors['--dusty'] },
  { id: 312, externalId: '2022', color: colors['--aspect-color-conifer'] },
  { id: 312, externalId: '2023', color: colors['--aspect-color-mint'] },
  { id: 312, externalId: '2024', color: colors['--aspect-color-supernova-2'] },
  { id: 312, externalId: '2025', color: colors['--aspect-color-powder'] },

  { id: 501, externalId: 'caseTotal', color: colors['--aspect-device-transfer-time'] },
  { id: 502, externalId: 'caseDetected', color: colors['--aspect-color-mandy'] },
  { id: 503, externalId: 'casePercentDetectedOfTotal', color: colors['--web-orange'] },

  { id: 999, externalId: 'Cases', color: colors['--aspect-color-conifer'] },
  { id: 1000, externalId: 'unknown', color: colors['--aspect-device-inactiveUnknown'] },
]

const filterColour = (valueId, graphId) => {
  let colorValue
  const tbResultsGraphs = ['tbResultsByCategory1Monthly', 'tbResultsByCategory1Aggregate']
  const tbResultsValues = ['Trace Detected', 'NotDetected', 'NoResult']
  const tRifGraphs = ['tbByCategory1Monthly', 'tbByCategory1Aggregate']
  const tbRifValues = ['NotDetected']
  const covidGraphs = ['covidByCategory1Monthly', 'covidByCategory1Aggregate']
  const covidValues = ['Negative', 'Unknown', 'NotDetected']
  switch (true) {
    case includes(tbResultsGraphs, graphId) && includes(tbResultsValues, valueId):
      colorValue = `${valueId}_${graphId}`
      break

    case includes(tRifGraphs, graphId) && includes(tbRifValues, valueId):
      colorValue = `${valueId}_${graphId}`
      break

    case includes(covidGraphs, graphId) && includes(covidValues, valueId):
      colorValue = `${valueId}_${graphId}`
      break

    default:
      colorValue = valueId
      break
  }

  return graphColorMap.filter(color => color.externalId === colorValue || color.id === 999)[0].color
}

const getTimePeriod = (cnt, period, dateFormat, end) => {
  let timePeriod
  const dateNow = new Date()
  switch (true) {
    case period === 'hours':
      timePeriod = subDays(dateNow, cnt)
      break
    case period === 'days':
      timePeriod = subDays(dateNow, cnt)
      break
    case period === 'months':
      if (end) {
        timePeriod = endOfMonthUTC(subMonths(dateNow, cnt).toISOString())
      } else {
        timePeriod = startOfMonthUTC(subMonths(dateNow, cnt).toISOString())
      }
      break
    case period === 'months-end':
    case period === 'years':
      timePeriod = startOfYearsAgo(cnt)
      break

    default:
      timePeriod = dateNow
      break
  }
  return format(timePeriod, dateFormat)
}

const removeStringsFromArray = string => {
  const removeStrings = ['devices', 'inactive']
  const newString = removeStrings.map(removeString => string.replace(removeString, ''))
  return newString.length > 1 ? newString[1] : newString[0]
}

const genLabel = (string, assaysFromState, formatMessage, intlMessages, i18nKeys) => {
  const dictionary = []
  assaysFromState.map(
    ({ resultCategories }) =>
      Array.isArray(resultCategories) &&
      resultCategories.map(
        ({ resultCategories }) =>
          Array.isArray(resultCategories) &&
          resultCategories.map(({ externalId, name }) => dictionary.push({ externalId, name }))
      )
  )

  const assayResults = uniqBy(dictionary, 'externalId')
  const newString = assayResults.filter(({ externalId }) => externalId === string)
  return formatMessage && intlMessages[i18nKeys[string]]
    ? formatMessage(intlMessages[i18nKeys[string]]) || get(nth(newString, 0), 'name')
    : startCase(removeStringsFromArray(string))
}

const calcPercentageForGraphs = (value = 0, total, precision = 4) => {
  return ((value / total) * 100).toFixed(precision)
}

// shortens large counts (e.g. 121107 -> 121.1K) so they fit inside chart labels/statistics
const formatCompactNumber = value =>
  new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(value)

const getAverageFromData = (data, value, which, notation, culture) => {
  if (data.length && which) {
    let totalForFilter = []
    const total = []
    data.map(d => total.push(sum(values(pick(d, value)).map(Number))))
    const totalSum = Number(sum(total))
    const totalSumAvg = which === '*' ? (totalSum / 12).toFixed(1) : totalSum
    const totalNotation = totalSumAvg > 1000 ? 'compact' : notation || 'standard'

    if (Array.isArray(which)) {
      const rangeTotal = which.reduce((acc, curr) => {
        const item = filter(data, ['label', curr])[0]
        if (item) {
          if (acc && acc.id) {
            acc[value] += parseFloat(item[value])
          } else {
            acc = {
              ...item,
              [value]: parseFloat(item[value]),
            }
          }
        }
        return acc
      }, {})

      if (Object.keys(rangeTotal).length !== 0 && rangeTotal.constructor === Object) {
        totalForFilter.push(rangeTotal)
      }
    } else if (which === '*') {
      totalForFilter.push({
        id: value,
        label: value,
        value: data.reduce((acc, curr) => acc + curr.value, 0),
      })
    } else {
      totalForFilter = filter(data, ['label', which]) || [{ [value]: 0 }]
    }

    if (totalForFilter && totalForFilter.length) {
      const sumData = data.reduce((acc, curr) => acc + parseFloat(curr.value), 0)
      const avg =
        sumData < 1 ? sumData : calcPercentageForGraphs(parseFloat(totalForFilter[0][value]), round(sumData), 1)

      const avgObj = {
        avg: parseFloat(avg),
        color: filterColour(totalForFilter[0].id),
        totals: new Intl.NumberFormat(culture, {
          notation: totalNotation,
        }).format(totalSumAvg),
      }
      return avgObj
    }
    console.warn('There are no data that match your config')
  }
  return {}
}

const flattenAssaysStructure = ({ data }) => {
  const output = []
  map(data, ({ resultCategories }) => map(resultCategories, category => output.push({ ...category })))
  return uniqBy(output, 'i18nKey')
}

const startOfYearsAgo = years => new Date(getYear(subYears(new Date(), years)), 0, 1)

const startOfMonthUTC = dateString => {
  const [datepart, time] = dateString.split('T')

  const offset = time.split(/[0-2]\d:[0-5]\d:[0-5]\d\.\d+|[0-2]\d:[0-5]\d:[0-5]\d/)[1]
  return new Date(
    startOfMonth(new Date(`${datepart}T00:00:00.000Z`))
      .toISOString()
      .replace('T00:00:00.000Z', `T00:00:00.000${offset}`)
  )
}

const endOfMonthUTC = dateString => {
  const [datepart, time] = dateString.split('T')
  const offset = time.split(/[0-2]\d:[0-5]\d:[0-5]\d\.\d+|[0-2]\d:[0-5]\d:[0-5]\d/)[1]
  return new Date(
    endOfMonth(new Date(`${datepart}T23:59:59.999Z`))
      .toISOString()
      .replace('T23:59:59.999Z', `T23:59:59.999${offset}`)
  )
}

const fillYear = (data, formatMessage) => {
  const result = []
  const yearMap = {}
  const monthMap = {
    [formatMessage(months[0])]: 0,
    [formatMessage(months[1])]: 0,
    [formatMessage(months[2])]: 0,
    [formatMessage(months[3])]: 0,
    [formatMessage(months[4])]: 0,
    [formatMessage(months[5])]: 0,
    [formatMessage(months[6])]: 0,
    [formatMessage(months[7])]: 0,
    [formatMessage(months[8])]: 0,
    [formatMessage(months[9])]: 0,
    [formatMessage(months[10])]: 0,
    [formatMessage(months[11])]: 0,
  }

  for (const item of data) {
    const { year, month, value } = item
    if (!yearMap[year]) {
      yearMap[year] = { ...monthMap }
    }
    yearMap[year][month] = value
  }

  Object.keys(yearMap).map(year =>
    Object.keys(monthMap).map(month => result.push({ year, month, value: yearMap[year][month] }))
  )
  return result
}

const prepAssaysForParams = whiteListed => {
  const assays = []
  map(whiteListed, value => assays.push({ assay: value }))
  return assays
}

const prepParamsForEndPoint = (urlParams, updatedParams) => {
  const params = []
  const paramsToUse = updatedParams && !isNull(values(updatedParams)[0]) ? updatedParams : urlParams

  map(paramsToUse, (value, key) =>
    isArray(value) ? map(value, v => params.push({ [key]: v })) : params.push({ [key]: value })
  )
  return params
}

const objectToArray = object => Object.entries(omitBy(object, isNil)).map(([name, value]) => ({ [name]: value }))

const getItemsForTrendsGraph = (data, states, lgas) => {
  let actualData = data
  if (states?.length) {
    /**
     * when state(s) selected in the filter - then make sure `actualData` contains
     * data for ALL selected states - if raw `data` from API doesn't have entries for
     * some state - use default value
     */
    actualData = (lgas.length ? lgas : states).map(({ name }) => {
      const d = data.find(it => it.locationName === name)
      if (d) {
        return d
      }
      return {
        locationName: name,
        currYearTotals: { cntAll: '-' },
        currYearMeanPerMonth: { cntAll: '-' },
        prevYearMeanPerMonth: { cntAll: '-' },
        today: { cntAll: '-' },
        trends: [{ year: new Date().getFullYear() }],
        noDataAvailable: true,
      }
    })
  }
  const yearSet = new Set(flatten(actualData?.map(it => it.trends.map(d => d.year))))
  const years = [...yearSet]
  years.sort()

  const tableData =
    actualData?.map(it => {
      const trends = years.map(year => {
        const y = it.trends.find(x => x.year === year)?.cntAll || 0
        return { x: year, y }
      })
      return {
        province: it.locationName,
        perYear: it.currYearTotals.cntAll,
        monthlyAverage: it.noDataAvailable ? '-' : round(it.currYearMeanPerMonth.cntAll),
        perDay: it.today.cntAll,
        trends,
        noDataAvailable: it.noDataAvailable,
      }
    }) || []
  let graphData = tableData?.map(({ province, trends, noDataAvailable }) => ({
    id: province,
    data: trends,
    noDataAvailable,
  }))
  if (graphData.length === graphData.filter(it => it.noDataAvailable).length) {
    graphData = []
  }

  return { graphData, tableData }
}

const formatDataByGraphType = (
  data,
  displayMethod,
  filterBy,
  formatForDate,
  indexBy,
  keyToConsume,
  i18nKeys,
  type,
  mergedParams,
  formatMessage,
  messages,
  formatDate
) => {
  let grouped
  switch (type) {
    case 'bar':
    case 'calendar':
    case 'stacked':
      grouped = groupByKey(data, indexBy, keyToConsume, displayMethod, formatForDate, filterBy)
      break

    case 'divergent':
      grouped = groupForDivergent(data, indexBy, keyToConsume, filterBy)
      break

    case 'barLegacyTreatment':
      grouped = groupForOldTreatmentAPI(data, keyToConsume, indexBy, formatForDate, filterBy, displayMethod)
      break

    case 'stackedDeviceActivity':
      grouped = groupForDeviceStatusAPI(data, keyToConsume, indexBy, formatForDate, filterBy)
      break

    case 'barInventory':
      grouped = groupForInventoryStatusAPI(data, i18nKeys, formatMessage, messages)
      break

    case 'pieLegacyTreatment':
      grouped = groupForPieOldTreatmentAPI(data, keyToConsume, indexBy, filterBy)
      break

    case 'pie':
      grouped = groupForPie(data, keyToConsume, indexBy, filterBy)
      break

    case 'pieRow':
      grouped = groupForPieRow(formatMessage, formatDate, data, mergedParams)
      break

    case 'line-trends': {
      const filtered = filterBy ? filterByMultiple(data, filterBy) : data
      return filtered
    }

    case 'bar-line':
      grouped = groupByKey(data, indexBy, keyToConsume, displayMethod, formatForDate, filterBy)
      return grouped

    default:
      grouped = false
      break
  }
  return grouped
}

const formatDateToYYYYMMDD = date => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0') // Months are zero-based
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const fillData = data => {
  const cities = []
  const years = []
  const result = []

  data.map(d => {
    if (!cities.includes(d.id)) cities.push(d.id)
    if (!years.includes(d.year)) years.push(d.year)
    return d
  })
  years.map(currYear => {
    cities.map(currCity => {
      const info = data.find(d => d.year === currYear && d.id === currCity)
      result.push(info || { id: currCity, year: currYear, value: 0 })
      return currCity
    })
    return currYear
  })
  return result
}

const getValidResults = data => {
  const validResults = data.filter(elem => !['Invalid', 'NoResult', 'Error'].includes(elem.id))

  const totalValidResults = validResults.reduce((sum, elem) => sum + elem.value, 0)

  return totalValidResults
}

export {
  filterColour,
  getTimePeriod,
  genLabel,
  calcPercentageForGraphs,
  formatCompactNumber,
  getAverageFromData,
  flattenAssaysStructure,
  fillYear,
  prepAssaysForParams,
  prepParamsForEndPoint,
  objectToArray,
  getItemsForTrendsGraph,
  formatDataByGraphType,
  formatDateToYYYYMMDD,
  fillData,
  getResultCategoryGroupsForResultList,
  negateTimeZoneOffset,
  getMinMaxDateFromMonthString,
  getValidResults,
}
