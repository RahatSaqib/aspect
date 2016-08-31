let config = require('./config')
let util = require('./util')

// initialize knex
let knex = require('knex')({
  client: 'mysql',
  connection: config.db
})

// extracts the parameters related to sorting and paging from the candidate
// params and modifies the query builder with the sort modifications
function sortPageParams(queryBuilder, params, defaultSort) {
  let sp = util.getSortPageParams(params, defaultSort)
  queryBuilder.orderBy(sp.sortCol, sp.sortDir).limit(sp.size).offset(sp.skip)
}

// extracts the parameters related to filtering from the candidate
// params and modifies the query builder with the filter modifications
function filterParams(queryBuilder, params, paramName, columnName = paramName) {
  if (params[paramName]) {
    queryBuilder.where(columnName, 'like', `%${params[paramName]}%`)
  }
}

module.exports = {
  knex,
  filterParams,
  sortPageParams
}
