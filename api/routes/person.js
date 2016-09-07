let camelize = require('camelize')
let Promise = require('bluebird')
let Joi = require('joi')
let { knex, filterParams, sortPageParams } = require('../db')
let { asyncHandler, validateSortPageParams } = require('../util')

module.exports = [{
  method: 'GET',
  path: '/person',
  handler: asyncHandler(listPeople),
  config: {
    description: 'People List',
    notes: 'Pageable and sortable list of people',
    validate: {
      query: Object.assign({
        name: Joi.string().allow('').description('Filter for person name')
      }, validateSortPageParams('name', 'level', 'state', 'lga'))
    }
  }
}]

function* listPeople(request){
  let {query} = request

  // get total count for paging
  let getCount = knex('person')
    .modify(filterParams, query, 'name')
    .count('id as count').first()

  // get rows
  let getItems = knex('person as p')
    .leftOuterJoin('person_level as pl', 'p.person_level_id', 'pl.id')
    .leftOuterJoin('state as s', 'p.state_id', 's.id')
    .leftOuterJoin('lga as l', 'p.lga_id', 'l.id')
    .modify(filterParams, query, 'name', 'p.name')
    .modify(sortPageParams, query, 'name')
    .select('p.id', 'p.name', 'pl.name as level', 's.name as state', 'l.name as lga')

  // return result when both queries are finished
  let [{count: total}, data] = yield Promise.all([getCount, getItems])
  let result = {ok: true, total, data, length: data.length}
  
  return camelize(result)
}
