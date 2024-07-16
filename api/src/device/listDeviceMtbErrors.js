const _ = require('lodash')
const { subMonths } = require('date-fns')
const { filterParams, knex } = require('../db')
const { getBasicsForDevicesReport } = require('./common/db')
const { allAssayToId } = require('../shared/dictionary')
const { getConstraints, addConstraints } = require('../auth/constraints')
const { getBaseQueryForFactResultsDeviceByTimeFrame } = require('../fact/common/db')

const listDeviceMtbErrors = async request => {
  const { query, auth } = request
  const dataConstraints = await getConstraints(auth.credentials)
  const { minDate, maxDate } = query

  /**
   * get all devices without pagination.
   * See `getPageParams()` in `api/src/routes.js` for more details how we use `size='all'`
   */
  query.size = 'all'
  /**
   * explicitly define deviceType for `CepheidGeneXpert` which will then be used for filter
   * in `getDeviceBaseExtendedQuery()` in `api/src/device/common/db.js` - see
   *   .modify(filterParams, query, { ..., deviceType: 'dt.externalId', ... })
   */
  query.deviceType = 'CepheidGeneXpert'

  const assayIds = await allAssayToId()

  const { getCount, resultCategoryIds } = await getBasicsForDevicesReport(dataConstraints, query)

  let assay = null
  if (query.assay && !Array.isArray(query.assay)) {
    assay = [query.assay]
  } else if (query.assay) {
    assay = query.assay
  }

  let dateFrom = _.isString(minDate) ? new Date(minDate) : minDate
  const dateTo = _.isString(maxDate) ? new Date(maxDate) : maxDate
  if (dateFrom >= dateTo) {
    dateFrom = subMonths(dateTo, 1)
  }
  /**
   * normalize dates in `query` for using
   * in func getBaseQueryForFactResultsDeviceByTimeFrame below
   */
  query.minDate = dateFrom
  query.maxDate = dateTo

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
  })
    .leftJoin('DeviceCapacity as dcap', 'd.deviceCapacityId', 'dcap.id')
    .sum({
      cntMtbResults: 'r.resultCount',
      cntMtbError: knex.raw(`
        case when r.resultCategory1 = ${resultCategoryIds.Error}
        then r.resultCount 
        else 0 
        end`),
      cntMtbInvalid: knex.raw(`
        case when r.resultCategory1 = ${resultCategoryIds.Invalid}
        then r.resultCount 
        else 0 
        end`),
      cntMtbNoResult: knex.raw(`
        case when r.resultCategory1 = ${resultCategoryIds.NoResult}
        then r.resultCount 
        else 0 
        end`),
    })
    .select(
      'd.name',
      'd.id',
      'd.shortName',
      'dt.name as type',
      's.name as siteName',
      'd.moduleBayCapacity as numberOfModules',
      'st.name as stateName',
      'lg.name as lgaName'
    )
    .whereIn('r.assayId', [assayIds.GxMtbRif, assayIds.GxMtbRifUltra])
    .groupBy('d.id')

  // return result when both queries are finished
  const [{ count: total }, data] = await Promise.all([getCount, factTableQuery])

  const getPercentage = (numerator, denominator) => {
    return Math.round(100 * (denominator ? numerator / denominator : 0)) / 100
  }

  const moduleTracker = {}
  // add more fields which depend on aggregations
  data.forEach(it => {
    // check if modules has already been considered for the device
    if (moduleTracker[it.id]) {
      it.numberOfModules = 0
    } else {
      moduleTracker[it.id] = true
    }
    it.percentMtbError = getPercentage(it.cntMtbError, it.cntMtbResults)
    it.percentMtbInvalid = getPercentage(it.cntMtbInvalid, it.cntMtbResults)
    it.percentMtbNoResult = getPercentage(it.cntMtbNoResult, it.cntMtbResults)
  })

  return { ok: true, total, length: data.length, data }
}

module.exports = listDeviceMtbErrors
