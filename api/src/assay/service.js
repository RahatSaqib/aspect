const Promise = require('bluebird')
const _ = require('lodash')
const { knex, filterParams, sortPageParams } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')

const SELECT_LIST_FIELDS = [
  'a.id',
  'at.id as assayTypeId',
  'a.name',
  'at.name as assayTypeName',
  'dt.id as deviceTypeId',
  'dt.name as deviceTypeName',
  'a.resultDataSchema',
  'a.resultCategory1Label',
  'a.resultCategory1i18nKey',
  'a.resultCategory2Label',
  'a.resultCategory2i18nKey',
]

const SELECT_LIST_RESULT_CATEGORY_FIELDS = [
  'rc.id',
  'rc.name',
  'rc.i18nKey',
  'rca.assayId',
]

function* listAssays(request) {
  const { query, auth } = request

  // get all assays that have results that user has access to
  const dataConstraints = yield getConstraints(auth.credentials)
  const usedAssayIds = yield knex('Result as r')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .modify(addConstraints, dataConstraints, { device: 'd' })
    .distinct('r.assayId')
    .pluck('assayId')

  // no get the assays with a field for hasResults
  const assayQuery = knex('Assay as a')
    .innerJoin('AssayType as at', 'a.assayTypeId', 'at.id')
    .innerJoin('DeviceType as dt', 'a.deviceTypeId', 'dt.id')
    .modify(filterParams, query, { name: 'a.name' })

  // get total count for paging
  const getCount = assayQuery.clone().count('a.id as count').first()

  // get rows
  const getItems = assayQuery
    .clone()
    .modify(sortPageParams, query, 'name')
    .select(SELECT_LIST_FIELDS)

  // return result when both queries are finished
  const [{ count: total }, rawAssays] = yield Promise.all([getCount, getItems])

  // get resultCategories for all assays
  const rawResultCategories = yield knex('ResultCategory as rc')
    .innerJoin('ResultCategoryAssay as rca', 'rc.id', 'rca.resultCategoryId')
    .whereIn('rca.assayId', _.map(rawAssays, 'id'))
    .select(SELECT_LIST_RESULT_CATEGORY_FIELDS)

  const resultCategoriesByAssayId = _.groupBy(rawResultCategories, 'assayId')

  // map rawAssays with extra values
  const assays = _.map(rawAssays, d =>
    _.assign({}, d, {
      hasResults: usedAssayIds.includes(d.id),
      resultDataSchema: JSON.parse(d.resultDataSchema),
      resultCategories: resultCategoriesByAssayId[d.id],
    })
  )

  const result = { ok: true, total, length: assays.length, data: assays }

  return result
}

module.exports = {
  listAssays,
}
