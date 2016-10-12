let Promise = require('bluebird')
let { knex, filterParams, sortPageParams } = require('../db')
let { getConstraints, addConstraints } = require('../auth/constraints')

const SELECT_LIST_FIELDS = [
// id, id, name, name
  'a.id', 'at.id as assayTypeId', 'a.name', 'at.name as assayTypeName'
]

function* listAssays(request){
  let {query, auth} = request

  // get data constraints
  let dataConstraints = yield getConstraints(auth.credentials)

  let assayQuery = knex('Assay as a')
    .leftJoin('AssayType as at', 'a.assayTypeId', 'at.id')
    .modify(filterParams, query, 'name', 'a.name')
    //.modify(addConstraints, dataConstraints, {device: 'd'})

  // get total count for paging
  let getCount = assayQuery.clone()
    .count('a.id as count').first()

  // get rows
  let getItems = assayQuery.clone()
    .modify(sortPageParams, query, 'name')
    .select(SELECT_LIST_FIELDS)

  // return result when both queries are finished
  let [{count: total}, data] = yield Promise.all([getCount, getItems])

  let result = {ok: true, total, length: data.length, data}

  return result
}

module.exports = {
  listAssays
}
