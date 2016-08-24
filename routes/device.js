let express = require('express')
let camelize = require('camelize')
let Promise = require('promise')
let jwtmiddleware = require('./jwtmiddleware')
let util = require('../util')

module.exports = function(config, db) {

  let routes = express.Router()
  let { knex } = db
  
  // all routes after this will require a token
  routes.use((req, res, next) => jwtmiddleware(req, res, next, config.secret))

  // return list of devices
  routes.get('/', function(req, res) {

    let sp = util.getSortPageParams(req, 'name')
    let name = req.query.name ? `%${req.query.name}%` : null

    // get total count for paging
    let getCount = knex('device').count('id as count').first()
    if(name) {
      getCount.where('name', 'like', name)
    }

    // get rows
    let getItems = knex('device')
      .select('id', 'name', 'shortname', 'created_on', 'last_ping_on', 'updated_on as last_seen',
        knex.raw('\'Active\' as status'), knex.raw('id * 134 as total_tests'))
      .orderBy(sp.sortCol, sp.sortDir)
      .limit(sp.size).offset(sp.skip)
    if(name) {
      getItems.where('name', 'like', name)
    }

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
