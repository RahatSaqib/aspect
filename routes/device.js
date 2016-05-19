let express = require('express')
let camelize = require('camelize')
let Promise = require('promise')
let jwtmiddleware = require('./jwtmiddleware')

module.exports = function(config, db) {

  let routes = express.Router()

  // all routes after this will require a token
  routes.use((req, res, next) => jwtmiddleware(req, res, next, config.secret))

  // return list of devices
  routes.get('/', function(req, res) {

    let sortCol = req.query.sortCol || 'name'
    let sortDir = req.query.sortDir == 'desc' ? 'desc' : 'asc'
    let page = req.query.page || 0
    let size = req.query.size || 20

    let getCount = new Promise(function(resolve, reject){
      // get total count
      db.queryOne(`select count(id) as count
                from device`,
                null, resolve, reject)
    })

    let getItems = new Promise((resolve, reject) => {
      // get rows
      db.query(`select id, name, shortname, created_on, last_ping_on
                  from device
                  order by ?? ${sortDir}`,
                  [sortCol], resolve, reject)
    })

    Promise.all([getCount, getItems]).then(function(value){

      // combine the results:
      value[1].total = value[0].data.count

      res.status(200).json(camelize(value[1]))
    }, function(err){
      res.status(500).json(camelize(err))
    })
  })

  return routes
}
