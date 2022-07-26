const Boom = require('@hapi/boom')
const dateFormat = require('date-fns/format')
const parseISO = require('date-fns/parseISO')
const sortBy = require('lodash/sortBy')
const { subMonths, startOfMonth, endOfMonth } = require('date-fns')
const { knex, filterParams, filterDateRangeParams } = require('../db')
const { addConstraints, getConstraints } = require('../auth/constraints')
const { resultStatusToId } = require('../shared/dictionary')
const { addResultCountsQuery, addTransferredQuery } = require('../shared/query')

async function confirmedTreatmentTracking(request) {
  const { auth, query } = request

  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)

  const { siteId, assayTypeId, resultCategoryId } = query

  const now = new Date()
  const resultStatusTransferId = await resultStatusToId('Transfer')

  /**
   * normalize query.minDate and query.maxDate
   */
  let { maxDate } = query
  if (maxDate) {
    maxDate = maxDate instanceof Date ? maxDate : parseISO(maxDate)
  } else {
    maxDate = endOfMonth(subMonths(now, 1))
  }
  if (maxDate > endOfMonth(now)) {
    return Boom.expectationFailed('"maxDate" can not be greater than current month')
  }
  let { minDate } = query
  if (minDate) {
    minDate = minDate instanceof Date ? minDate : parseISO(minDate)
  } else {
    minDate = startOfMonth(subMonths(maxDate, 11)) // 12 months period by default
  }
  query.maxDate = maxDate
  query.minDate = minDate

  let data = await knex('Result as r')
    // filter by access level of current user
    .leftOuterJoin('Site as s', 'r.siteId', 's.id')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .leftOuterJoin('Geography as g', 'r.geographyId', 'g.id')
    .innerJoin('Sample as sp', 'r.sampleId', 'sp.id')
    .innerJoin('Assay as a', 'a.id', 'r.assayId')
    // add joins and different counts for results - (not)onTreatment, requiresTreatment, notPossible, ...
    .modify(queryBuilder => {
      addResultCountsQuery(queryBuilder, knex)
    })
    // add joins/count for 'transferred' results
    .modify(queryBuilder => {
      addTransferredQuery(queryBuilder, knex, resultStatusTransferId, {
        minDate,
        maxDate,
      })
    })
    .modify(queryBuilder => {
      if (assayTypeId && resultCategoryId) {
        queryBuilder.where('a.assayTypeId', assayTypeId).where('r.resultCategory1', resultCategoryId)
      }
    })
    .modify(filterDateRangeParams, query, 'r.endedOn')
    .modify(filterParams, query, {
      countryId: 'g.countryId',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      assayId: 'r.assayId',
      deviceId: 'd.id',
      deviceName: 'd.name',
      siteName: 's.name',
      siteId: 's.id',
    })
    .modify(addConstraints, dataConstraints, {
      assay: 'a',
      device: 'd',
      geography: 'g',
      result: 'r',
      site: 's',
      sample: 'sp',
    })
    .select(
      knex.raw(`date_format(r.endedOn, '%Y-%m') AS monthTested`) // group by r.endedOn as 'yyyy-MM'
    )
    .groupBy('monthTested')

  data = data.map(d => {
    // add percentages
    const getPercentage = (total, value) => {
      let pc = 0
      if (total) {
        pc = (value * 100) / total
        // max 1 decimal point
        pc = Math.round(10 * pc) / 10
      }
      return pc
    }
    /**
     * define 'total' prop as alias for 'delivered' (defined in func addResultCountsQuery),
     * mostly for graphs which already may use it
     */
    d.total = d.delivered
    d.pcOnTreatment = getPercentage(d.total, d.onTreatment)
    return d
  })

  let dt = maxDate
  while (dt >= minDate) {
    const monthTested = dateFormat(dt, 'yyyy-MM')
    if (!data.find(x => x.monthTested === monthTested)) {
      data.push({
        monthTested,
        pcOnTreatment: 0,
        total: 0,

        totalResults: 0,
        delivered: 0,
        requiresTreatment: 0,
        onTreatment: 0,
        notPossible: 0,
        notOnTreatment: 0,
        transferred: 0,
      })
    }
    dt = endOfMonth(subMonths(dt, 1))
  }

  return {
    ok: true,
    data: sortBy(data, [x => x.monthTested]),
    siteId,
    minDate,
    maxDate,
  }
}

module.exports = confirmedTreatmentTracking
