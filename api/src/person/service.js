let camelize = require('camelize')
let Promise = require('bluebird')
let { knex, filterParams, sortPageParams } = require('../db')

function* listPeople(request){
  let {query} = request

  // get total count for paging
  let getCount = knex('person')
    .modify(filterParams, query, 'name')
    .count('id as count').first()

  // TODO What do we do when a user has many roles? (currently delited list)
  let getRoleNames = knex('UserRole as ur')
    .innerJoin('Role as r', 'ur.roleId', 'r.id')
    .where('ur.userId', '=', knex.raw('p.userId'))
    .select(knex.raw('group_concat(r.name separator "; ")'))
    .as('level')

  // get rows
  let getItems = knex('person as p')
    .leftOuterJoin('state as s', 'p.state_id', 's.id')
    .leftOuterJoin('lga as l', 'p.lga_id', 'l.id')
    .modify(filterParams, query, 'name', 'p.name')
    .modify(sortPageParams, query, 'name')
    .select('p.id', 'p.name', getRoleNames,
      's.name as state', 'l.name as lga')

  // return result when both queries are finished
  let [{count: total}, data] = yield Promise.all([getCount, getItems])
  let result = {ok: true, total, data, length: data.length}
  
  return camelize(result)
}

module.exports = {
  listPeople
}
