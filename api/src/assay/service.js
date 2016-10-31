const Promise = require('bluebird')
const _ = require('lodash')
const { knex, filterParams, sortPageParams } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')

const SELECT_LIST_FIELDS = [
  'a.id', 'at.id as assayTypeId', 'a.name', 'at.name as assayTypeName',
  'dt.id as deviceTypeId', 'dt.name as deviceTypeName', 'a.resultDataSchema'
]

function* listAssays(request) {
  const {query, auth} = request

  // get all assays that have results that user has access to
  const dataConstraints = yield getConstraints(auth.credentials)
  const usedAssays = yield knex('Result as r')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .modify(addConstraints, dataConstraints, { device: 'd' })
    .distinct('r.assayId')
  const assayIds =  _.map(usedAssays, c => c.assayId)

  // no get the assays with a field for hasResults
  const assayQuery = knex('Assay as a')
    .innerJoin('AssayType as at', 'a.assayTypeId', 'at.id')
    .innerJoin('DeviceType as dt', 'a.deviceTypeId', 'dt.id')
    .modify(filterParams, query, { 'name': 'a.name' })

  // get total count for paging
  const getCount = assayQuery.clone()
    .count('a.id as count').first()

  // get rows
  const getItems = assayQuery.clone()
    .modify(sortPageParams, query, 'name')
    .select(SELECT_LIST_FIELDS)

  // return result when both queries are finished
  let [{count: total}, data] = yield Promise.all([getCount, getItems])
  data = _.each(data, (d) => {
    d.hasResults = assayIds.includes(d.id)
    d.resultDataSchema = JSON.parse(d.resultDataSchema)
  })

  const result = { ok: true, total, length: data.length, data }

  return result
}

module.exports = {
  listAssays
}
