let camelize = require('camelize')
let Promise = require('bluebird')
let Joi = require('joi')
let { knex, requestFilter, requestSortPage } = require('../db')
let { asyncHandler } = require('../util')

module.exports = [{
  method: 'GET',
  path: '/api/person',
  handler: asyncHandler(listPeople),
  config: {
    description: 'People List',
    notes: 'Pageable and sortable list of people',
    tags: ['api'],
    validate: {
      query: {
        sortCol: Joi.string().description('Sort on named column'),
        sortDir: Joi.string().allow('asc', 'desc').description('Sort order ascending or descending'),
        page: Joi.number().integer().positive().description('Page index'),
        size: Joi.number().integer().positive().description('Page size'),
        name: Joi.string().description('Filter for device name')
      }
    }
  }
}]

function* listPeople(request){
  // get total count for paging
  let getCount = knex('person')
    .modify(requestFilter, request, 'name')
    .count('id as count').first()

  // get rows
  let getItems = knex('person as p')
    .leftOuterJoin('person_level as pl', 'p.person_level_id', 'pl.id')
    .leftOuterJoin('state as s', 'p.state_id', 's.id')
    .leftOuterJoin('lga as l', 'p.lga_id', 'l.id')
    .modify(requestFilter, request, 'name', 'p.name')
    .modify(requestSortPage, request, 'name')
    .select('p.id', 'p.name', 'pl.name as level', 's.name as state', 'l.name as lga')

  // return result when both queries are finished
  let [{count: total}, data] = yield Promise.all([getCount, getItems])
  let result = {ok: true, total, data, length: data.length}
  
  return camelize(result)
}
