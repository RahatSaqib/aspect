let express = require('express')
let camelize = require('camelize')
let Promise = require('bluebird')
let jwtmiddleware = require('./jwtmiddleware')

module.exports = function(config, db) {

  let routes = express.Router()
  let { knex, requestFilter, requestSortPage } = db
  
  // all routes after this will require a token
  routes.use((req, res, next) => jwtmiddleware(req, res, next, config.secret))

  // return list of devices
  routes.get('/', function(req, res) {
    
    // get total count for paging
    let getCount = knex('device')
      .modify(requestFilter, req, 'name')
      .count('id as count').first()

    // get rows
    let getItems = knex('device')
      .modify(requestFilter, req, 'name')
      .modify(requestSortPage, req, 'name')
      .select('id', 'name', 'shortname', 'created_on', 'last_ping_on', 'updated_on as last_seen',
        knex.raw('\'Active\' as status'), knex.raw('id * 134 as total_tests'))

    // return result when both queries are finished
    Promise.all([getCount, getItems]).then(function(value){
      let [{count: total}, data] = value
      let result = {ok: true, total, data, length: data.length}
      
      res.status(200).json(camelize(result))
    }, function(err){
      res.status(500).json(camelize(err))
    })
  })

  return routes
}
