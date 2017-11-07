const _ = require('lodash')
const { getSortPageParams, getSortParams, getPageParams } = require('./routes')

let knex = null // see load
let Description = ''

function query(description) {
  Description = description
  return load()
}

// extracts the parameters related to sorting and paging from the candidate
// params and modifies the query builder with the sort & paging modifications
function sortPageParams(queryBuilder, params, defaultSort, sortColumnMapping) {
  const sortingAndPagingValues = getSortPageParams(
    params,
    sortColumnMapping,
    defaultSort
  )
  queryBuilder
    .orderBy(sortingAndPagingValues.sortCol, sortingAndPagingValues.sortDir)
    .limit(sortingAndPagingValues.size)
    .offset(sortingAndPagingValues.skip)
}

// extracts the parameters related to sorting from the candidate params and
// modifies the query builder with the sort modifications
function sortParams(queryBuilder, params, defaultSort, sortColumnMapping) {
  const sortingValues = getSortParams(params, sortColumnMapping, defaultSort)
  queryBuilder.orderBy(sortingValues.sortCol, sortingValues.sortDir)
}

// extracts the parameters related to paging from the candidate params and
// modifies the query builder with the paging modifications
function pageParams(queryBuilder, params) {
  const pagingValues = getPageParams(params)
  queryBuilder.limit(pagingValues.size).offset(pagingValues.skip)
}

function getWhereArgs(columnName, paramValue) {
  if (_.isString(paramValue)) {
    return [columnName, 'like', `%${paramValue}%`]
  } else if (_.isArray(paramValue)) {
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
    if (_.isArray(columnNameOrArray)) {
      queryBuilder.where(function() {
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
      queryBuilder.whereIn(
        ...getWhereArgs(columnNameOrArray, params[paramName])
      )
    } else {
      queryBuilder.where(...getWhereArgs(columnNameOrArray, params[paramName]))
    }
  })
}

// extracts the parameters related to filtering from the candidate
// params and modifies the query builder with the filter modifications
function filterDateRangeParams(queryBuilder, params, dateColumnName) {
  if (params.minDate) {
    queryBuilder.where(dateColumnName, '>=', params.minDate)
  }
  if (params.maxDate) {
    queryBuilder.where(dateColumnName, '<', params.maxDate)
  }
}

// helper function for run, transact and migration
const makeBlockRunner = block => blockArg =>
  block(blockArg).catch(err => {
    console.error(err) // eslint-disable-line no-console
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

// Helper for seeed files. Ru
function seed(seed) {
  return {
    seed(knex) {
      return knex.transaction(makeBlockRunner(seed))
    },
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
  seed,
  transact,
  description: Description,
}

Object.defineProperty(module.exports, 'knex', { get: load })
