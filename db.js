let config = require('./config')
let util = require('./util')

// initialize knex
let knex = require('knex')({
  client: 'mysql',
  connection: config.db
})

// extracts the parameters related to sorting and paging from the query
// string and modifies the query builder with the sort modifications
function requestSortPage(queryBuilder, request, defaultSort) {
  let sp = util.getSortPageParams(request, defaultSort)
  queryBuilder.orderBy(sp.sortCol, sp.sortDir).limit(sp.size).offset(sp.skip)
}

// extracts the parameters related to filtering from the query
// string and modifies the query builder with the filter modifications
function requestFilter(queryBuilder, request, paramName, columnName = paramName) {
  let { query } = request
  if (query[paramName]) {
    queryBuilder.where(columnName, 'like', `%${query[paramName]}%`)
  }
}

module.exports = {
  knex,
  requestFilter,
  requestSortPage
}