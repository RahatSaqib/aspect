const Boom = require('@hapi/boom')
const dateFormat = require('date-fns/format')
const sortBy = require('lodash/sortBy')
const { subMonths, startOfMonth, endOfMonth } = require('date-fns')
const { knex } = require('../db')
const { addConstraints, getConstraints } = require('../auth/constraints')
const { resultStatusToId } = require('../shared/dictionary')
const { addTransferredQuery } = require('../shared/query')

async function confirmedTreatmentTracking(request) {
  const { auth, payload } = request

  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)

  const { siteId, assayTypeId, resultCategoryId } = payload

  const now = new Date()
  const lastEndedOn = endOfMonth(subMonths(now, 1))

  // normalize and format 'endedOn'
  let { endedOn } = payload
  if (!endedOn) {
    endedOn = subMonths(now, 1)
  }
  endedOn = endOfMonth(endedOn)
  if (endedOn > lastEndedOn) {
    return Boom.expectationFailed(
      '"endedOn" can not be greater than previous month'
    )
  }
  const startedOn = startOfMonth(subMonths(endedOn, 11)) // 12 months period
  const resultStatusTransferId = await resultStatusToId('Transfer')

  const query = await knex('Result as r')
    // consider 100% as all results where requiresTreatment = 1 in the resultCategoryAssay table
    .innerJoin('ResultCategoryAssay as rca', function () {
      this.on('r.assayId', 'rca.assayId').andOn(
        'r.resultCategory1',
        'rca.resultCategoryId'
      )
    })
    .leftOuterJoin(
      'ResultTreatmentStatusLog as rtsl',
      'r.treatmentStatusLogId',
      'rtsl.id'
    )
    .leftOuterJoin(
      'ResultTreatmentStatus as rts',
      'rtsl.resultTreatmentStatusId',
      'rts.id'
    )
    // filter by access level of current user
    .leftOuterJoin('Site as s', 'r.siteId', 's.id')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .leftOuterJoin('Geography as g', 'r.geographyId', 'g.id')
    .innerJoin('Sample as sp', 'r.sampleId', 'sp.id')
    .innerJoin('Assay as a', 'a.id', 'r.assayId')
    // join to ResultDownloadLog for counting results 'delivered' to Reporters
    .leftOuterJoin('ResultDownloadLog as rdl', 'rdl.resultId', 'r.id')
    // add joins/count for 'transferred' results
    .modify(queryBuilder => {
      addTransferredQuery(queryBuilder, knex, resultStatusTransferId, {
        minDate: startedOn,
        maxDate: endedOn,
      })
    })
    .modify(queryBuilder => {
      if (assayTypeId && resultCategoryId) {
        queryBuilder
          .where('a.assayTypeId', assayTypeId)
          .where('r.resultCategory1', resultCategoryId)
      }
    })
    .modify(addConstraints, dataConstraints, {
      assay: 'a',
      device: 'd',
      geography: 'g',
      result: 'r',
      site: 's',
      sample: 'sp',
    })
    // if 'siteId' specified - filter by siteId
    .where(function () {
      if (siteId) {
        this.where('s.id', siteId)
      }
    })
    // filter by date range, inclusive
    .where('r.endedOn', '>=', startedOn)
    .where('r.endedOn', '<=', endedOn)
    .count({
      totalResults: knex.raw('DISTINCT r.id'),
      delivered: knex.raw('DISTINCT rdl.resultId'),
      /**
       * We should only be counting results that were delivered in the last four columns
       * because we're measuring how many of the results are linked to treatment on the
       * Reporter and they can't put results on treatment if they were never delivered
       * to the reporter.
       */
      requiresTreatment: knex.raw(`DISTINCT
        CASE
          WHEN rca.requiresTreatment = 1  AND  rca.reportable = 1  AND  r.reportableSiteId = s.id
          THEN rdl.resultId ELSE null
        END`),
      onTreatment: knex.raw(`DISTINCT
        CASE
          WHEN rca.requiresTreatment = 1  AND  rca.reportable = 1  AND  r.reportableSiteId = s.id  AND  rts.externalId = 'OnTreatment'
          THEN rdl.resultId ELSE null
        END`),
      notPossible: knex.raw(`DISTINCT
        CASE
          WHEN rca.requiresTreatment = 1  AND  rca.reportable = 1  AND  r.reportableSiteId = s.id  AND  rts.externalId = 'NotPossible'
          THEN rdl.resultId ELSE null
        END`),
      notOnTreatment: knex.raw(`DISTINCT
        CASE
          WHEN rca.requiresTreatment = 1  AND  rca.reportable = 1  AND  r.reportableSiteId = s.id  AND  (rts.externalId = 'AwaitingTreatment' OR rts.id is null)
          THEN rdl.resultId ELSE null
        END`),

      // TODO: check with Stefan - may be need to count only delivered results (rdl.resultId)
      total: knex.raw(`DISTINCT
        CASE
          WHEN rca.requiresTreatment = 1  AND  ifnull(rts.externalId, '') != 'NotPossible'
          THEN r.id ELSE null
        END`),
    })
    .select(
      knex.raw(`date_format(r.endedOn, '%Y-%m') AS monthTested`) // group by r.endedOn as 'yyyy-MM'
    )
    .groupBy('monthTested')

  const data = query.map(d => {
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
    d.pcOnTreatment = getPercentage(d.total, d.onTreatment)
    return d
  })

  let dt = endedOn
  while (dt >= startedOn) {
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
    siteId,
    endedOn: dateFormat(endedOn, 'yyyy-MM-dd'),
    lastOn: dateFormat(lastEndedOn, 'yyyy-MM-dd'),
    data: sortBy(data, [x => x.monthTested]),
  }
}

module.exports = confirmedTreatmentTracking
