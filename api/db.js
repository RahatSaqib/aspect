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

// helper function for transact and run
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
function transact(block){
  return knex.transaction(trx => runBlock(block, trx))
}

// Returns a promise that runs the provided generator function
function run(block){
  return runBlock(block, knex)
}

// initialize on demand to allow custom knex object
// in testing/migrations
function load(knexOverride){
  if(knexOverride){
    knex = knexOverride
  } else if(!knex){
    let config = require('./config')
    knex = require('knex')({
      client: 'mysql',
      connection: config.db
    })
  }
  return knex
}

module.exports = {
  load,
  filterParams,
  sortPageParams,
  run,
  transact
}

Object.defineProperty(module.exports, 'knex', {
  get(){
    return load()
  }
})
