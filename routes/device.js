// let async = require('async')
let express = require('express')
let jwtmiddleware = require('./jwtmiddleware')
// let moment = require('moment')

// let jwtmiddleware = require('./jwtmiddleware')
// let util = require('./../util')

module.exports = function(config, db) {

  let routes = express.Router()

  // all routes after this will require a token
  routes.use((req, res, next) => jwtmiddleware(req, res, next, config.secret))

  // return list of devices
  routes.get('/', function(req, res) {

    db.find('device', 'id, name, shortname, created_on, last_ping_on', null, function(r){
      res.status(r.result == 'success' ? 200 : 500).json(r)
    })

  })

  return routes
}
