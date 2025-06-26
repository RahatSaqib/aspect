const Boom = require('@hapi/boom')
const _ = require('lodash')
const { format, parseISO, addMonths, startOfYear, subYears, endOfMonth, eachDayOfInterval } = require('date-fns')
const locales = require('date-fns/locale')
const { knex, filterParams } = require('../../db')
const { getConstraints, canViewResults, addConstraints } = require('../../auth/constraints')
const { getBaseQueryForFactResultsDeviceByTimeFrame } = require('../../fact/common/db')
const { getPersonByPersonId } = require('../../auth/service')
const { getPartnerWorkingDaysConfig } = require('../../partner/common/db')
const { convertMysqlDayOfWeekToDateFns } = require('../../shared/date')

const WORKING_DAYS_IN_YEAR = 252
const DEFAULT_MODULES = 4
const DEFAULT_DAILY_CAPACITY = DEFAULT_MODULES * 3

/**
 * Calculates the number of working days between two dates, considering client-specific configurations.
 *
 * @param {string} minDate - The start date in ISO format (e.g., "2023-01-01T00:00:00.000Z")
 * @param {string} maxDate - The end date in ISO format (e.g., "2023-12-31T23:59:59.999Z")
 * @param {Object} [clientConfig={}] - Value of Partner.customWorkingDays
 * @param {number} [clientConfig.daysPerYear] - Predefined working days for a full year period
 * @param {number} [clientConfig.daysPerQuarter] - Predefined working days for a full quarter period
 * @param {number} [clientConfig.daysPerMonth] - Predefined working days for a full month period
 * @param {string} [clientConfig.excludedDays] - Comma-separated string of days to exclude (MySQL DAYOFWEEK format: 1=Sunday, 7=Saturday)
 *
 * @returns {number} The number of working days in the specified date range
 *
 * @description
 * This function calculates working days by first checking if the date range represents a standard period
 * (full year, quarter, or month) and if the client has predefined values for such periods. If so, it returns
 * the predefined value. Otherwise, it calculates the actual working days by generating all dates in the range
 * and filtering out excluded days (defaults to weekends: Saturday and Sunday).
 *
 * @example
 * // Calculate working days for a month with default weekend exclusion
 * getWorkingDays("2023-01-01T00:00:00.000Z", "2023-01-31T23:59:59.999Z")
 * // Returns: 22 (assuming January 2023 has 22 weekdays)
 *
 * @example
 * // Calculate working days with custom excluded days (excluding Monday and Tuesday)
 * getWorkingDays("2023-01-01T00:00:00.000Z", "2023-01-31T23:59:59.999Z", { excludedDays: "2,3" })
 * // Returns: 13 (excluding Mondays and Tuesdays)
 */
const getWorkingDays = (minDate, maxDate, clientConfig = {}) => {
  // Parse the input dates and reset time to midnight without considering time zone
  const startDate = new Date(minDate.split('T')[0])
  const endDate = new Date(maxDate.split('T')[0])

  const isMonthPeriod = () => {
    return (
      startDate.getDate() === 1 &&
      endDate.getMonth() === startDate.getMonth() &&
      endDate.getDate() === endOfMonth(endDate).getDate()
    )
  }

  const isQuarterPeriod = () => {
    // Get the start of the quarter
    const quarter = Math.floor(startDate.getMonth() / 3)
    const quarterStartMonth = quarter * 3

    // Check if startDate is first day of quarter
    const isStartOfQuarter = startDate.getMonth() === quarterStartMonth && startDate.getDate() === 1

    // Check if endDate matches last day of quarter (comparing month and day directly)
    const isEndOfQuarter =
      endDate.getMonth() === quarterStartMonth + 2 && // Last month of quarter
      endDate.getDate() === new Date(endDate.getFullYear(), quarterStartMonth + 3, 0).getDate() // Last day of that month

    return isStartOfQuarter && isEndOfQuarter
  }

  const isYearPeriod = () => {
    return (
      startDate.getMonth() === 0 &&
      startDate.getDate() === 1 &&
      endDate.getMonth() === 11 &&
      endDate.getDate() === 31 &&
      endDate.getFullYear() === startDate.getFullYear()
    )
  }

  // If it's a standard period and client has config, use the config values
  if (clientConfig) {
    if (isYearPeriod() && clientConfig.daysPerYear) {
      return clientConfig.daysPerYear
    }
    if (isQuarterPeriod() && clientConfig.daysPerQuarter) {
      return clientConfig.daysPerQuarter
    }
    if (isMonthPeriod() && clientConfig.daysPerMonth) {
      return clientConfig.daysPerMonth
    }
  }

  // Otherwise calculate actual working days using functional approach
  const excludedDays = clientConfig?.excludedDays?.split(',').map(convertMysqlDayOfWeekToDateFns) || [5, 6] // Default to exclude weekends

  // Generate array of all dates in the interval
  const allDates = eachDayOfInterval({ start: startDate, end: endDate })

  // Filter out excluded days and count working days
  const totalWorkingDays = allDates.filter(date => !excludedDays.includes(date.getDay())).length

  return totalWorkingDays
}

async function getAnnualUtilizationData(auth, query, { timeFrame }) {
  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)

  const { culture } = await getPersonByPersonId(auth.credentials.personId)

  const { minDate, maxDate } = query

  let assay = null
  if (query.assay && !Array.isArray(query.assay)) {
    assay = [query.assay]
  } else if (query.assay) {
    assay = query.assay
  }
  /**
   * get base query which uses FactResultsDeviceByTimeFrame table
   */
  const factTableQuery = getBaseQueryForFactResultsDeviceByTimeFrame(knex, {
    addConstraints,
    dataConstraints,
    filterParams,
    assay,
    query,
    timeFrame: 'day',
  }).where('dt.externalId', ['CepheidGeneXpert'])
  /**
   * get all devices recorded in FactResultsDeviceByTimeFrame during whole period
   */
  let devices = await factTableQuery
    .clone()
    .groupBy('d.id')
    .select(
      'd.name',
      'd.id',
      knex.raw('COALESCE(d.gx6cModulesCount, 0) + COALESCE(d.gx10cModulesCount, 0) as modules'),
      'd.dailyTestCapacity as dailyCapacity',
      'd.moduleBayCapacity as modules',
      'st.id as stateId',
      'st.name as stateName',
      'lg.name as lgaName'
    )
  devices = devices.map(device => {
    const dailyCapacity = device.dailyCapacity || DEFAULT_DAILY_CAPACITY
    const modules = device.modules || DEFAULT_MODULES
    return {
      ...device,
      dailyCapacity,
      modules,
    }
  })
  /**
   * get counts item by device and timeFrame
   */
  const timeFrameField =
    timeFrame === 'year'
      ? knex.raw(`DATE_FORMAT(r.startedOn, "%Y") as ${timeFrame}_value`)
      : knex.raw(`DATE_FORMAT(r.startedOn, "%Y-%m") as ${timeFrame}_value`)
  const deviceCountsByPeriod = await factTableQuery
    .clone()
    .select([timeFrameField, 'd.id'])
    .groupBy('d.id', `${timeFrame}_value`)
  /**
   * device map with deviceId as a key - to quickly get device data by id
   */
  const deviceMap = _.reduce(
    devices,
    (acc, { id, ...rest }) => {
      acc[id] = rest
      return acc
    },
    {}
  )
  return { deviceMap, devices, deviceCountsByPeriod, culture, minDate, maxDate }
}

async function getAnnualUtilizationRatesNationalBase(auth, query) {
  if (!canViewResults(auth)) {
    return Boom.forbidden('You do not have access to results')
  }
  const timeFrame = 'year'
  const { deviceMap, deviceCountsByPeriod, culture, minDate, maxDate } = await getAnnualUtilizationData(auth, query, {
    timeFrame,
  })

  const customWorkingDaysConfig = await getPartnerWorkingDaysConfig(auth)

  const CUSTOM_WORKING_DAYS_IN_YEAR = query.tableData
    ? getWorkingDays(query.minDate, query.maxDate, customWorkingDaysConfig)
    : customWorkingDaysConfig
    ? customWorkingDaysConfig?.daysPerYear
    : WORKING_DAYS_IN_YEAR
  /**
   *
   */
  const dynamicColumns = getDynamicColumnsForTimeFrame(timeFrame, minDate, maxDate, culture)
  /**
   * calculate rate for each device and period
   */
  _.each(deviceCountsByPeriod, item => {
    const device = deviceMap[item.id]
    device.rates = device.rates || []
    const percent = (item.cnt * 100) / Math.max(device.dailyCapacity * CUSTOM_WORKING_DAYS_IN_YEAR, 1)
    const rateItem = { year: item.year_value, count: item.cnt, rate: _.round(percent, 2) }
    device.rates = [...device.rates, rateItem]
  })
  /**
   * transform map back to list
   */
  const data = _.reduce(
    _.keys(deviceMap),
    (acc, id) => {
      const deviceRow = deviceMap[id]
      acc = [...acc, { id, ...deviceRow }]
      return acc
    },
    []
  )
  /**
   *
   */
  return {
    ok: true,
    total: data.length,
    length: data.length,
    data: _.orderBy(data, 'name'),
    dynamicColumns,
    WORKING_DAYS_IN_YEAR: CUSTOM_WORKING_DAYS_IN_YEAR,
  }
}

async function getAnnualUtilizationRatesProvincialBase(auth, query) {
  if (!canViewResults(auth)) {
    return Boom.forbidden('You do not have access to results')
  }
  const timeFrame = 'year'
  const { deviceMap, deviceCountsByPeriod, culture, minDate, maxDate } = await getAnnualUtilizationData(auth, query, {
    timeFrame,
  })

  const customWorkingDaysConfig = await getPartnerWorkingDaysConfig(auth)

  const customWorkingDays = customWorkingDaysConfig ? customWorkingDaysConfig.daysPerYear : WORKING_DAYS_IN_YEAR
  /**
   *
   */
  const dynamicColumns = getDynamicColumnsForTimeFrame(timeFrame, minDate, maxDate, culture)
  /**
   *
   */
  const stateMap = _.reduce(
    _.keys(deviceMap),
    (acc, deviceId) => {
      const device = deviceMap[deviceId]
      const { id, stateId, stateName, modules, dailyCapacity } = device
      /**
       * if device is not assigned to a State - then simply skip it for now
       */
      if (_.isNil(stateId) || _.isNil(stateName)) {
        return acc
      }

      acc[stateId] = acc[stateId] || { stateName, deviceIds: [], modules: 0, dailyCapacity: 0, periodMap: {} }
      const state = acc[stateId]
      state.deviceIds = [...state.deviceIds, id]
      /**
       * increase `modules` and `dailyCapacity` for this state
       */
      state.modules += modules
      state.dailyCapacity += dailyCapacity
      /**
       * keep reference to stateMap object for state of this device
       */
      device.refState = state
      return acc
    },
    {}
  )
  /**
   * for each state count all tests per period by each device
   */
  _.each(deviceCountsByPeriod, item => {
    const periodName = item.year_value
    const state = deviceMap[item.id].refState
    if (state) {
      state.periodMap[periodName] = (state.periodMap[periodName] || 0) + item.cnt
    }
  })
  /**
   *
   */
  const data = _.reduce(
    _.keys(stateMap),
    (acc, stateId) => {
      const state = stateMap[stateId]
      _.keys(state.periodMap).forEach(periodName => {
        state.rates = state.rates || []

        const totalInPeriod = state.periodMap[periodName]
        const percent = (totalInPeriod * 100) / Math.max(state.dailyCapacity * customWorkingDays, 1)
        const rateItem = { year: periodName, count: totalInPeriod, rate: _.round(percent, 2) }
        state.rates = [...state.rates, rateItem]
      })
      delete state.deviceIds
      delete state.periodMap
      acc = [...acc, { stateId, ...state }]
      return acc
    },
    []
  )
  /**
   *
   */
  return {
    ok: true,
    total: data.length,
    length: data.length,
    data: _.orderBy(data, 'stateName'),
    dynamicColumns,
  }
}

async function getAnnualUtilizationRatesNational(auth, query) {
  const now = new Date()
  query.minDate = startOfYear(subYears(now, 5)).toISOString()
  query.maxDate = now.toISOString()

  const res = await getAnnualUtilizationRatesNationalBase(auth, query)
  if (Boom.isBoom(res)) return res
  /**
   *
   */
  res.data.forEach(d => {
    d.rates.forEach(r => {
      d[r.year] = r.rate
    })
  })
  return res
}

async function getAnnualUtilizationRatesProvincial(auth, query) {
  const now = new Date()
  query.minDate = startOfYear(subYears(now, 5)).toISOString()
  query.maxDate = now.toISOString()

  const res = await getAnnualUtilizationRatesProvincialBase(auth, query)
  if (Boom.isBoom(res)) return res
  /**
   *
   */
  res.data.forEach(d => {
    d.rates.forEach(r => {
      d[r.year] = r.rate
    })
  })
  return res
}

function getDynamicColumnsForTimeFrame(timeFrame, minDate, maxDate, culture) {
  /**
   * dynamicColumns
   */
  const dynamicColumns = []
  const maxDateFormatted = _.isDate(maxDate) ? maxDate : parseISO(maxDate)
  const minDateFormatted = _.isDate(minDate) ? minDate : parseISO(minDate)
  if (timeFrame === 'year') {
    /**
     * for last 5 years
     */
    const minYear = minDateFormatted.getFullYear()
    const maxYear = maxDateFormatted.getFullYear()
    let curYear = minYear
    while (curYear <= maxYear) {
      dynamicColumns.push({
        key: `${curYear}`,
        header: `${curYear} (%)`,
      })
      curYear += 1
    }
  } else {
    /**
     * timeFrame = 'month'
     */
    const locale = culture.split('-')[0].toLowerCase()
    let curMonth = minDateFormatted
    while (curMonth <= maxDateFormatted) {
      dynamicColumns.push({
        key: format(curMonth, 'yyyy-MM'),
        header: `${format(curMonth, 'yyyy-LLL', {
          locale: locales[locale],
        })}\n (%)`,
      })
      curMonth = addMonths(curMonth, 1)
    }
  }

  return dynamicColumns
}

async function listAnnualUtilizationRateNational(request) {
  const { query, auth } = request
  const res = await getAnnualUtilizationRatesNationalBase(auth, query)
  if (Boom.isBoom(res)) return res
  return _.omit(res, ['dynamicColumns'])
}

async function listAnnualUtilizationRateProvincial(request) {
  const { query, auth } = request
  const res = await getAnnualUtilizationRatesProvincialBase(auth, query)
  if (Boom.isBoom(res)) return res
  return _.omit(res, ['dynamicColumns'])
}

module.exports = {
  // helper funcs for reports
  getAnnualUtilizationRatesNational,
  getAnnualUtilizationRatesProvincial,
  // endpoint handlers
  listAnnualUtilizationRateNational,
  listAnnualUtilizationRateProvincial,
  getWorkingDays,
}
