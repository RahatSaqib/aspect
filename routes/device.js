let express = require('express')
let camelize = require('camelize')
let Promise = require('promise')
let jwtmiddleware = require('./jwtmiddleware')
let util = require('../util')

module.exports = function(config, db) {

  let routes = express.Router()

  // all routes after this will require a token
  routes.use((req, res, next) => jwtmiddleware(req, res, next, config.secret))

  // return list of devices
  routes.get('/', function(req, res) {

    let sp = util.getSortPageParams(req, 'name')
    let name = req.query.name ? '%' + req.query.name + '%' : '%'
    let whereClause = 'where name like ?'

    // get total count for paging
    let getCount = new Promise(function(resolve, reject){
      db.queryOne(` select count(id) as count
                    from device
                    ${whereClause}`,
        [name], resolve, reject)
    })

    // get rows
    let getItems = new Promise((resolve, reject) => {
      db.query(`select id, name, shortname, created_on, last_ping_on,
                updated_on as last_seen, 'Active' as status, id * 134 as total_tests
                from device
                ${whereClause}
                order by ?? ${sp.sortDir}
                limit ?, ?`,
        [name, sp.sortCol, sp.skip, sp.size], resolve, reject)
    })

    // return result when both queries are finished
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
