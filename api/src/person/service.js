const Promise = require('bluebird')
const { knex, filterParams, sortPageParams } = require('../db')

function* listPeople(request) {
  const { query } = request

  // get total count for paging
  const getCount = knex('Person')
    .modify(filterParams, query, 'name')
    .count('id as count').first()

  // TODO What do we do when a user has many roles? (currently delited list)
  const getRoleNames = knex('UserRole as ur')
    .innerJoin('Role as r', 'ur.roleId', 'r.id')
    .where('ur.userId', '=', knex.raw('p.userId'))
    .select(knex.raw('group_concat(r.name separator "; ")'))
    .as('level')

  // get rows
  const getItems = knex('Person as p')
    .leftOuterJoin('State as s', 'p.stateId', 's.id')
    .leftOuterJoin('Lga as l', 'p.lgaId', 'l.id')
    .modify(filterParams, query, { name: 'p.name' })
    .modify(sortPageParams, query, 'name')
    .select('p.id', 'p.name', getRoleNames,
      's.name as state', 'l.name as lga')

  // return result when both queries are finished
  const [{ count: total }, data] = yield Promise.all([getCount, getItems])
  const result = { ok: true, total, data, length: data.length }

  return result
}

module.exports = {
  listPeople
}
