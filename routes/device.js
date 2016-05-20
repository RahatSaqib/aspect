let express = require('express')
let camelize = require('camelize')
let decamelize = require('decamelize')
let Promise = require('promise')
let jwtmiddleware = require('./jwtmiddleware')

module.exports = function(config, db) {

  let routes = express.Router()

  // all routes after this will require a token
  routes.use((req, res, next) => jwtmiddleware(req, res, next, config.secret))

  // return list of devices
  routes.get('/', function(req, res) {

    let sortCol = decamelize(req.query.sortCol) || 'name'
    let sortDir = req.query.sortDir == 'desc' ? 'desc' : 'asc'
    let page = parseInt(req.query.page) || 0
    let size = parseInt(req.query.size) || 20
    let skip = page * size

    // get total count for paging
    let getCount = new Promise(function(resolve, reject){
      db.queryOne(`select count(id) as count
                  from device`,
                  null, resolve, reject)
    })

    // get rows
    let getItems = new Promise((resolve, reject) => {
      db.query(`select id, name, shortname, created_on, last_ping_on,
                updated_on as last_seen, 'Active' as status, id * 134 as total_tests
                from device
                order by ?? ${sortDir}
                limit ?, ?`,
                [sortCol, skip, size], resolve, reject)
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
