const Boom = require('@hapi/boom');
const dateFormat = require('date-fns/format');
const sortBy = require('lodash/sortBy');
const { subMonths, startOfMonth, endOfMonth } = require('date-fns');
const { knex } = require('../../db');
const { addConstraints, getConstraints } = require('../../auth/constraints');

async function confirmedTreatmentTracking(request) {
  const { auth, payload } = request;

  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials);

  const { siteId, assayTypeId, resultCategoryId } = payload;

  const now = new Date();
  const lastEndedOn = endOfMonth(subMonths(now, 1));

  // normalize and format 'endedOn'
  let { endedOn } = payload;
  if (!endedOn) {
    endedOn = subMonths(now, 1);
  }
  endedOn = endOfMonth(endedOn);
  if (endedOn > lastEndedOn) {
    return Boom.expectationFailed(
      '"endedOn" can not be greater than previous month'
    );
  }
  const startedOn = startOfMonth(subMonths(endedOn, 5)); // 6 months period

  const data = await knex('Result as r')
    // consider 100% as all results where requiresTreatment = 1 in the resultCategoryAssay table
    .innerJoin('ResultCategoryAssay as rca', function() {
      this.on('r.assayId', 'rca.assayId').andOn(
        'r.resultCategory1',
        'rca.resultCategoryId'
      );
    })
    .where('rca.requiresTreatment', 1)
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
    .modify(queryBuilder => {
      if (assayTypeId && resultCategoryId) {
        queryBuilder
          .where('a.assayTypeId', assayTypeId)
          .where('r.resultCategory1', resultCategoryId);
      }
    })
    .modify(addConstraints, dataConstraints, {
      assay: 'a',
      device: 'd',
      geography: 'g',
      result: 'r',
      site: 's',
      sample: 'sp'
    })
    // if 'siteId' specified - filter by siteId
    .where(function() {
      if (siteId) {
        this.where('s.id', siteId);
      }
    })
    // filter by date range, inclusive
    .where('r.endedOn', '>=', startedOn)
    .where('r.endedOn', '<=', endedOn)
    .select(
      knex.raw('sum(ifnull(rts.externalId, "") != "NotPossible") as total'),
      knex.raw('sum(rts.externalId = "OnTreatment") as cntConfirmed'),
      knex.raw(`date_format(r.endedOn, '%Y-%m') AS monthTested`) // group by r.endedOn as 'yyyy-MM'
    )
    .groupBy('monthTested')
    .map(d => {
      // add percentages
      const getPercentage = (total, value) => {
        let pc = 0;
        if (total) {
          pc = (value * 100) / total;
          // max 1 decimal point
          pc = Math.round(10 * pc) / 10;
        }
        return pc;
      };
      d.pcConfirmed = getPercentage(d.total, d.cntConfirmed);
      return d;
    });

  let dt = endedOn;
  while (dt >= startedOn) {
    const monthTested = dateFormat(dt, 'yyyy-MM');
    if (!data.find(x => x.monthTested === monthTested)) {
      data.push({
        monthTested,
        pcConfirmed: 0,
        cntConfirmed: 0,
        total: 0
      });
    }
    dt = endOfMonth(subMonths(dt, 1));
  }

  return {
    siteId,
    endedOn: dateFormat(endedOn, 'yyyy-MM-dd'),
    lastOn: dateFormat(lastEndedOn, 'yyyy-MM-dd'),
    data: sortBy(data, [x => x.monthTested])
  };
}

module.exports = confirmedTreatmentTracking;
