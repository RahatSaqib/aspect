let Promise = require('bluebird')
let util = require('./util')
let knex = null // see load


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

// helper function for run, transact and migration
let runBlock = Promise.coroutine(function*(block, blockArg){
  try {
    return yield* block(blockArg)
  } catch(err){
    console.error(err)
    throw err
  }
})

// Returns a promise that runs the provided generator function
// within a knex transaction
//
// See also run
function transact(block){
  return load().transaction(trx => runBlock(block, trx))
}

// Returns a promise that runs the provided generator function
// without a transaction
//
// See also transact
function run(block){
  return runBlock(block, load())
}

// Helper for migrations. Loads db with knex set by migration
// and runs provided up and down generator functions
// In migrate files, create up and down generators and
// set module.exports = migrate(up, down)
function migration(up, down){
  return {
    up(knex){
      return runBlock(up, knex)
    },

    down(knex){
      return runBlock(down, knex)
    }
  }
}

// Helper for seeed files. Ru
function seed(seed){
  return {
    seed(knex){
      return knex.transaction(trx => runBlock(seed, trx))
    }
  }
}

// initialize on demand to allow custom knex object
// in testing/migrations
function load(){
  if(!knex){
    let config = require('./config')
    knex = require('knex')({
      client: 'mysql',
      connection: config.db
    })
  }
  return knex
}

module.exports = {
  filterParams,
  sortPageParams,
  migration,
  run,
  seed,
  transact
}

Object.defineProperty(module.exports, 'knex', { get: load })
