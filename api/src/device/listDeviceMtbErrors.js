const { sortPageParams } = require('../db')
const { getBasicsForDevicesReport } = require('./common/db')
const { allAssayToId } = require('../shared/dictionary')
const { getConstraints } = require('../auth/constraints')

const listDeviceMtbErrors = async request => {
  const { query, auth } = request
  const dataConstraints = await getConstraints(auth.credentials)

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

  const { getCount, queryResults, deviceQuery, resultCategoryIds } = await getBasicsForDevicesReport(
    dataConstraints,
    query
  )

  const getResultsBase = () =>
    queryResults.clone().whereIn('a.id', [assayIds.GxMtbRif, assayIds.GxMtbRifUltra]).countDistinct('r.id')

  // get rows
  const getItems = deviceQuery
    .clone()
    .leftJoin('DeviceCapacity as dcp', 'd.deviceCapacityId', 'dcp.id')
    .modify(sortPageParams, query, 'name')
    .distinct([
      'd.id',
      'd.name',
      'd.shortName',
      'dt.name as type',
      'st.name as stateName',
      'lg.name as lgaName',
      's.name as siteName',

      'dcp.modules as numberOfModules',
      getResultsBase().as('cntMtbResults'),
      getResultsBase().where('r.resultCategory1', resultCategoryIds.Error).as('cntMtbError'),
      getResultsBase().where('r.resultCategory1', resultCategoryIds.Invalid).as('cntMtbInvalid'),
      getResultsBase().where('r.resultCategory1', resultCategoryIds.NoResult).as('cntMtbNoResult'),
    ])

  // return result when both queries are finished
  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  const getPercentage = (numerator, denominator) => {
    return Math.round(100 * (denominator ? numerator / denominator : 0)) / 100
  }
  // add more fields which depend on aggregations
  data.forEach(async it => {
    it.percentMtbError = getPercentage(it.cntMtbError, it.cntMtbResults)
    it.percentMtbInvalid = getPercentage(it.cntMtbInvalid, it.cntMtbResults)
    it.percentMtbNoResult = getPercentage(it.cntMtbNoResult, it.cntMtbResults)
  })

  return { ok: true, total, length: data.length, data }
}

module.exports = listDeviceMtbErrors
