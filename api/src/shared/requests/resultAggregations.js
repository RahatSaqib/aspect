const Joi = require('@hapi/joi')
const Boom = require('@hapi/boom')
const { knex, filterParams } = require('../../db')
const { validateDateRangeParams } = require('../../routes')
const {
  addConstraints,
  canViewResults,
  getConstraints,
} = require('../../auth/constraints')

const resultAggregationsValidGroups = [
  'resultCategory1',
  'resultCategory2',
  'week',
  'month',
  'year',
  'gender',
  'age',
  'state',
  'day',
]
const validateResultAggregations = () => ({
  ...validateDateRangeParams(),
  assayType: Joi.string()
    .allow('')
    .description('Filter for assay type'),
  assay: Joi.alternatives()
    .try(Joi.array(), Joi.string())
    .description('Filter for assay'),
  resultCategory1: Joi.string()
    .allow('')
    .description('Filter for result category 1'),
  resultCategory2: Joi.string()
    .allow('')
    .description('Filter for result category 2'),
  siteName: Joi.string()
    .allow('')
    .description('Filter for site'),
  deviceName: Joi.string()
    .allow('')
    .description('Filter for device'),
  groupBy: Joi.alternatives()
    .allow('', null)
    .try(
      Joi.array().items(Joi.string().valid(resultAggregationsValidGroups)),
      Joi.string().valid(resultAggregationsValidGroups)
    )
    .description('Array of fields to group by'),
})

const responseResultAggregationsItem = () => ({
  cnt: Joi.number()
    .required()
    .description('The count of results in the group'),
  resultCategory1: Joi.string()
    .allow(null)
    .description('Result Category 1 that count is grouped by'),
  resultCategory2: Joi.string()
    .allow(null)
    .description('Result Category 2 that count is grouped by'),
  week: Joi.string().description('The week that the count is grouped by'),
  month: Joi.string().description('The month that the count is grouped by'),
  year: Joi.string().description('The year that the count is grouped by'),
  day: Joi.string().description('The day that the count is grouped by'),
  gender: Joi.string()
    .allow(null)
    .description('The gender that the count is grouped by'),
  age: Joi.number()
    .allow(null)
    .description('The age that the count is grouped by'),
  state: Joi.string()
    .allow(null)
    .description('The state that the count is grouped by'),
})

async function resultAggregations(request) {
  const { auth, query } = request

  if (!canViewResults(auth)) {
    throw Boom.unauthorized('You do not have access to results')
  }

  let assay = null
  if (query.assay && !Array.isArray(query.assay)) {
    assay = [query.assay]
  } else if (query.assay) {
    assay = query.assay
  }

  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)

  const resultQuery = knex('Result as r')
    .innerJoin('Device as d', 'd.id', 'r.deviceId')
    .innerJoin('Site as s', 's.id', 'r.siteId')
    .innerJoin('Assay as a', 'a.id', 'r.assayId')
    .innerJoin('AssayType as at', 'at.id', 'a.assayTypeId')
    .innerJoin('ResultCategory as rc1', 'rc1.id', 'r.resultCategory1')
    .leftJoin('ResultCategory as rc2', 'rc2.id', 'r.resultCategory2')
    .leftJoin('Geography as g', 's.geographyId', 'g.id')
    .leftJoin('State as st', 'st.id', 'g.stateId')
    .innerJoin('ResultCategoryAssay as rca', function() {
      this.on('r.assayId', 'rca.assayId').andOn(
        'r.resultCategory1',
        'rca.resultCategoryId'
      )
    })
    .leftJoin('ResultCategoryAssay as rсa2', function() {
      this.on('r.assayId', 'rсa2.assayId').andOn(
        'r.resultCategory2',
        'rсa2.resultCategoryId'
      )
    })
    .modify(qb => {
      const { followUp, followUpType } = query
      if (followUp || followUpType) {
        qb.leftJoin('ResultFollowUp as rfu', 'r.id', 'rfu.resultId')
          .leftJoin('FollowUp as fu', 'rfu.followUpId', 'fu.id')
          .leftJoin('FollowUpType as fut', 'fu.followUpTypeId', 'fut.id')

        if (followUp) {
          qb.where('fu.externalId', '=', followUp)
        }
        if (followUpType) {
          qb.where('fut.externalId', '=', followUpType)
        }
      }
    })
    .modify(addConstraints, dataConstraints, {
      device: 'd',
      geography: 'g',
      site: 's',
    })
    .modify(filterParams, query, {
      countryId: 'g.countryId',
      deviceName: 'd.name',
      partnerId: 'g.partnerId',
      siteName: 's.name',
    })
    .modify(qb => {
      if (assay) {
        qb.whereIn('a.externalId', assay)
      }
      if (query.assayType) {
        qb.where('at.externalId', '=', query.assayType)
      }
      if (query.minDate) {
        qb.where('r.endedOn', '>=', query.minDate)
      }
      if (query.maxDate) {
        qb.where('r.endedOn', '<=', query.maxDate)
      }
      if (query.resultCategory1) {
        qb.where('rc1.externalId', '=', query.resultCategory1)
      }
      if (query.resultCategory2) {
        qb.where('rc2.externalId', '=', query.resultCategory2)
      }
    })
    .where('rca.reportable', true)
    .orderBy('r.endedOn')
    .count('r.id as cnt')

  // if no group is specified, use result category
  let { groupBy } = query
  if (!groupBy) {
    groupBy = ['resultCategory1']
  } else if (!Array.isArray(groupBy)) {
    groupBy = [groupBy]
  }

  // handle possible groups:
  const paramToDb = {
    resultCategory1: 'rc1.externalId as resultCategory1',
    resultCategory2: 'rc2.externalId as resultCategory2',
    week: knex.raw('DATE_FORMAT(r.endedOn, "%x-%v") as week'),
    month: knex.raw('DATE_FORMAT(r.endedOn, "%Y-%m") as month'),
    year: knex.raw('DATE_FORMAT(r.endedOn, "%Y") as year'),
    day: knex.raw('DATE_FORMAT(r.endedOn, "%Y-%m-%d") as day'),
    gender: knex.raw(
      'replace(r.patientData ->> "$.gender", "null", null) as gender'
    ),
    age: knex.raw('replace(r.patientData ->> "$.age", "null", null) as age'),
    state: 'st.name as state',
  }

  groupBy.forEach(g => {
    resultQuery.modify(qb => {
      qb.select(paramToDb[g])
      qb.groupBy(g)
      qb.orderBy(g)
    })
  })
  return {
    data: await resultQuery,
  }
}

module.exports = {
  resultAggregations,
  responseResultAggregationsItem,
  validateResultAggregations,
}
