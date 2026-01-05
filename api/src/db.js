const _ = require('lodash')
const knexLib = require('knex')
const { getSortPageParams, getSortParams, getPageParams } = require('./routes')
const logger = require('./shared/logger')
const knexConfig = require('../knexfile')

function query() {
  return load()
}

// extracts the parameters related to sorting and paging from the candidate
// params and modifies the query builder with the sort & paging modifications
function sortPageParams(queryBuilder, params, defaultSort, sortColumnMapping, getExtraItemToCheckNextPage = false) {
  const sortingAndPagingValues = getSortPageParams(params, sortColumnMapping, defaultSort, getExtraItemToCheckNextPage)
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

/**
 * Generates the WHERE clause arguments for a database query based on the given column name, parameter value, and options.
 * @param {string} columnName - The name of the column to filter on.
 * @param {string|Array} paramValue - The value(s) to filter by.
 * @param {Object} [options={}] - Additional options for generating the WHERE clause arguments.
 * @param {boolean} [options.handleNullValues=false] - Specifies whether to handle null values in the WHERE clause. Added to ensure backward compatibility and migrate without code breakages
 * @returns {Array} An array containing the WHERE clause arguments.
 */
function getWhereArgs(columnName, paramValue, options = {}) {
  if (_.isString(paramValue)) {
    return [columnName, 'like', `%${paramValue}%`]
  }
  if (_.isArray(paramValue)) {
    return [columnName, paramValue]
  }
  if (options.handleNullValues && paramValue === null) {
    return [columnName, 'is', paramValue]
  }
  return [columnName, '=', paramValue]
}

/**
 * Extract and apply filters to a query builder based on the provided parameters.
 *
 * @param {QueryBuilder} queryBuilder - The query builder object.
 * @param {Object} params - The parameters object containing the filter values.
 * @param {Object} filters - The filters object mapping parameter names to column names or arrays of column names.
 * @param {Object} [options] - The optional options object.
 * @param {Object} [options.whereArgs] - The optional where arguments object.
 */
function filterParams(queryBuilder, params, filters, options = {}) {
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
            this.orWhereIn(...getWhereArgs(columnName, params[paramName], options.whereArgs))
          } else {
            this.orWhere(...getWhereArgs(columnName, params[paramName], options.whereArgs))
          }
        })
      })
    } else if (_.isArray(params[paramName])) {
      queryBuilder.whereIn(...getWhereArgs(columnNameOrArray, params[paramName], options.whereArgs))
    } else {
      queryBuilder.where(...getWhereArgs(columnNameOrArray, params[paramName], options.whereArgs))
    }
  })
}

/**
 * Apply a date filter to a knex query, given a date range.
 * @param {knex} queryBuilder
 * @param {Object} params Object with minDate and maxDate properties to use as filter.
 * @param {String} dateColumnName Date field to filter on. Should include the alias (e.g. 'r.endedOn').
 * @param {Object} config Config object. `{allowNulls: true}` should be used if you are filtering on left joined tables.
 */
function filterDateRangeParams(queryBuilder, { minDate, maxDate }, dateColumnName, { allowNulls = false } = {}) {
  if (minDate && minDate.toString() !== 'Invalid Date') {
    queryBuilder.where(function () {
      this.where(dateColumnName, '>=', minDate)
      if (allowNulls) this.orWhereNull(dateColumnName)
    })
  }

  if (maxDate && maxDate.toString() !== 'Invalid Date') {
    queryBuilder.where(function () {
      this.where(dateColumnName, '<', maxDate)
      if (allowNulls) this.orWhereNull(dateColumnName)
    })
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

// Lazy initialization of the Knex instance
let knex = null

function load() {
  if (!knex) {
    knex = knexLib(knexConfig)
  }

  return knex
}

function knexConnectionWithoutSchema() {
  // Create a new knex instance without the database name
  const config = { ...knexConfig }
  delete config.connection.database
  return knexLib(config)
}

async function getCurrentSslCipher(knex) {
  const result = await knex.raw(`SHOW STATUS LIKE 'ssl_cipher';`)
  const cipher = result[0]?.[0]?.Value
  return cipher
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
  getCurrentSslCipher,
}

Object.defineProperty(module.exports, 'knex', { get: load })
Object.defineProperty(module.exports, 'knexConnectionWithoutSchema', { get: knexConnectionWithoutSchema })
