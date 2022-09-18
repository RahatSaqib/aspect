const _ = require('lodash')
const { getSortPageParams, getSortParams, getPageParams } = require('./routes')
const logger = require('./shared/logger')

let knex = null // see load

function query() {
  return load()
}

// extracts the parameters related to sorting and paging from the candidate
// params and modifies the query builder with the sort & paging modifications
function sortPageParams(queryBuilder, params, defaultSort, sortColumnMapping) {
  const sortingAndPagingValues = getSortPageParams(params, sortColumnMapping, defaultSort)
  queryBuilder.orderBy(sortingAndPagingValues.orderBy)
  if (sortingAndPagingValues.size) {
    queryBuilder.limit(sortingAndPagingValues.size).offset(sortingAndPagingValues.skip)
  }
}

// extracts the parameters related to sorting from the candidate params and
// modifies the query builder with the sort modifications
function sortParams(queryBuilder, params, defaultSort, sortColumnMapping) {
  const { orderBy } = getSortParams(params, sortColumnMapping, defaultSort)
  queryBuilder.orderBy(orderBy)
}

// extracts the parameters related to paging from the candidate params and
// modifies the query builder with the paging modifications
function pageParams(queryBuilder, params) {
  const pagingValues = getPageParams(params)
  // missing `size` means no limitation in size and querying all items
  if (pagingValues.size) {
    queryBuilder.limit(pagingValues.size).offset(pagingValues.skip)
  }
}

function getWhereArgs(columnName, paramValue) {
  if (_.isString(paramValue)) {
    return [columnName, 'like', `%${paramValue}%`]
  }
  if (_.isArray(paramValue)) {
    return [columnName, paramValue]
  }
  return [columnName, '=', paramValue]
}

// extracts the parameters related to filtering from the candidate
// params and modifies the query builder with the filter modifications
function filterParams(queryBuilder, params, filters) {
  _.each(filters, (columnNameOrArray, paramName) => {
    if (_.isUndefined(params[paramName])) {
      return
    }
    if (_.isFunction(columnNameOrArray)) {
      columnNameOrArray(queryBuilder, params[paramName])
    } else if (_.isArray(columnNameOrArray)) {
      queryBuilder.where(function () {
        // http://knexjs.org/#Builder-where
        columnNameOrArray.forEach(columnName => {
          if (_.isArray(params[paramName])) {
            this.orWhereIn(...getWhereArgs(columnName, params[paramName]))
          } else {
            this.orWhere(...getWhereArgs(columnName, params[paramName]))
          }
        })
      })
    } else if (_.isArray(params[paramName])) {
      queryBuilder.whereIn(...getWhereArgs(columnNameOrArray, params[paramName]))
    } else {
      queryBuilder.where(...getWhereArgs(columnNameOrArray, params[paramName]))
    }
  })
}

/**
 * Apply a date filter to a knex query, given a date range.
 * @param {*} queryBuilder
 * @param {*} params This are the URL params received for applying in the query
 * @param {*} dateColumnName Because we can have other fields for date like for example expirationdate or endedon
 * @param {*} dateParamName This is how the date max and min are named in the url
 */
function filterDateRangeParams(queryBuilder, params, dateColumnName, dateParamName = 'Date') {
  if (params[`min${dateParamName}`] && params[`min${dateParamName}`].toString() !== 'Invalid Date') {
    queryBuilder.where(dateColumnName, '>=', params[`min${dateParamName}`])
  }
  if (params[`max${dateParamName}`] && params[`max${dateParamName}`].toString() !== 'Invalid Date') {
    queryBuilder.where(dateColumnName, '<', params[`max${dateParamName}`])
  }
}
// helper function for run, transact and migration
const makeBlockRunner = block => blockArg =>
  block(blockArg).catch(err => {
    logger.error(err)
    throw err
  })

// Returns a promise that runs the provided generator function
// within a knex transaction
//
// See also run
function transact(block) {
  return load().transaction(makeBlockRunner(block))
}

// Returns a promise that runs the provided generator function
// without a transaction
//
// See also transact
function run(block) {
  return makeBlockRunner(block)(load())
}

// Helper for migrations. Loads db with knex set by migration
// and runs provided up and down generator functions
// In migrate files, create up and down generators and
// set module.exports = migrate(up, down)
function migration(up, down) {
  return {
    up: makeBlockRunner(up),
    down: makeBlockRunner(down),
  }
}

// initialize on demand to allow custom knex object
// in testing/migrations
function load() {
  if (!knex) {
    const config = require('./config')
    knex = require('knex')({
      client: 'mysql',
      connection: config.db,
      pool: {
        min: 2,
        max: config.db.connectionLimit,
      },
    })
  }
  return knex
}

module.exports = {
  query,
  filterParams,
  filterDateRangeParams,
  sortPageParams,
  sortParams,
  pageParams,
  migration,
  run,
  transact,
}

Object.defineProperty(module.exports, 'knex', { get: load })
