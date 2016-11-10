const Promise = require('bluebird')
const { knex, filterParams, sortPageParams } = require('../db')

function* listPeople(request){
  const {query} = request

  const personQuery = knex('Person as p')
    .leftOuterJoin('State as s', 'p.stateId', 's.id')
    .leftOuterJoin('Lga as l', 'p.lgaId', 'l.id')
    .modify(filterParams, query, {
      countryId: 'p.countryId',
      stateId: 'p.stateId',
      lgaId: 'p.lgaId',
      contactNameOrEmail: ['p.name', 'p.email', 'p.email2']
    })

  // get total count for paging
  const getCount = personQuery.clone()
    .count('p.id as count')
    .first()

  // TODO What do we do when a user has many roles? (currently delited list)
  const getRoleNames = knex('UserRole as ur')
    .innerJoin('Role as r', 'ur.roleId', 'r.id')
    .where('ur.userId', '=', knex.raw('p.userId'))
    .select(knex.raw('group_concat(r.name separator "; ")'))
    .as('level')

  // get rows
  const getItems = personQuery.clone()
    .modify(sortPageParams, query, 'p.name')
    .select('p.id', 'p.name', getRoleNames,
      's.name as state', 'l.name as lga')

  // return result when both queries are finished
  const [{count: total}, data] = yield Promise.all([getCount, getItems])

  const result = {ok: true, total, data, length: data.length}

  return result
}

module.exports = {
  listPeople
}
