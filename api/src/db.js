const Promise = require('bluebird')
const _ = require('lodash')
const { getSortPageParams } = require('./routes')

let knex = null // see load

function query() {
  return load()
}

// extracts the parameters related to sorting and paging from the candidate
// params and modifies the query builder with the sort modifications
function sortPageParams(queryBuilder, params, defaultSort) {
  const sp = getSortPageParams(params, defaultSort)
  queryBuilder.orderBy(sp.sortCol, sp.sortDir).limit(sp.size).offset(sp.skip)
}

function getWhereArgs(columnName, paramValue) {
  if (_.isString(paramValue)) {
    return [columnName, 'like', `%${paramValue}%`]
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
      queryBuilder.where(function () {
        // http://knexjs.org/#Builder-where
        columnNameOrArray.forEach((columnName) => {
          this.orWhere(...getWhereArgs(columnName, params[paramName]))
        })
      })
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
const runBlock = Promise.coroutine(function* (block, blockArg) {
  try {
    return yield* block(blockArg)
  } catch (err) {
    console.error(err)
    throw err
  }
})

// Returns a promise that runs the provided generator function
// within a knex transaction
//
// See also run
function transact(block) {
  return load().transaction(trx => runBlock(block, trx))
}

// Returns a promise that runs the provided generator function
// without a transaction
//
// See also transact
function run(block) {
  return runBlock(block, load())
}

// Helper for migrations. Loads db with knex set by migration
// and runs provided up and down generator functions
// In migrate files, create up and down generators and
// set module.exports = migrate(up, down)
function migration(up, down) {
  return {
    up(knex) {
      return runBlock(up, knex)
    },

    down(knex) {
      return runBlock(down, knex)
    }
  }
}

// Helper for seeed files. Ru
function seed(seed) {
  return {
    seed(knex) {
      return knex.transaction(trx => runBlock(seed, trx))
    }
  }
}

// initialize on demand to allow custom knex object
// in testing/migrations
function load() {
  if (!knex) {
    const config = require('./config')
    knex = require('knex')({
      client: 'mysql',
      connection: config.db
    })
  }
  return knex
}

module.exports = {
  query,
  filterParams,
  filterDateRangeParams,
  sortPageParams,
  migration,
  run,
  seed,
  transact
}

Object.defineProperty(module.exports, 'knex', { get: load })
