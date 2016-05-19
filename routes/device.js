let express = require('express')
let jwtmiddleware = require('./jwtmiddleware')
// let util = require('./../util')

module.exports = function(config, db) {

  let routes = express.Router()

  // all routes after this will require a token
  routes.use((req, res, next) => jwtmiddleware(req, res, next, config.secret))

  // return list of devices
  routes.get('/', function(req, res) {

    let sortCol = req.query.sortCol
    let sortDir = req.query.sortDir

    db.find('device', 'id, name, shortname, created_on, last_ping_on', null, function(r){
      res.status(r.ok ? 200 : 500).json(r)
    })

  })

  return routes
}
