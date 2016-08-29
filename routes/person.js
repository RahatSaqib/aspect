let express = require('express')
let camelize = require('camelize')
let Promise = require('bluebird')
let jwtmiddleware = require('./jwtmiddleware')

module.exports = function(config, db) {

  let routes = express.Router()

  let { knex, requestFilter, requestSortPage } = db


  // all routes after this will require a token
  routes.use((req, res, next) => jwtmiddleware(req, res, next, config.secret))

  // return list of persons
  routes.get('/', function(req, res) {
    // get total count for paging
    let getCount = knex('person')
      .modify(requestFilter, req, 'name')
      .count('id as count').first()

    // get rows
    let getItems = knex('person as p')
      .leftOuterJoin('person_level as pl', 'p.person_level_id', 'pl.id')
      .leftOuterJoin('state as s', 'p.state_id', 's.id')
      .leftOuterJoin('lga as l', 'p.lga_id', 'l.id')
      .modify(requestFilter, req, 'name', 'p.name')
      .modify(requestSortPage, req, 'name')
      .select('p.id', 'p.name', 'pl.name as level', 's.name as state', 'l.name as lga')

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
