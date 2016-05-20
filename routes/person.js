let express = require('express')
let camelize = require('camelize')
let decamelize = require('decamelize')
let Promise = require('promise')
let jwtmiddleware = require('./jwtmiddleware')

module.exports = function(config, db) {

  let routes = express.Router()

  // all routes after this will require a token
  routes.use((req, res, next) => jwtmiddleware(req, res, next, config.secret))

  // return list of persons
  routes.get('/', function(req, res) {

    let sortCol = req.query.sortCol ? decamelize(req.query.sortCol) : 'name'
    let sortDir = req.query.sortDir == 'desc' ? 'desc' : 'asc'
    let page = parseInt(req.query.page) || 0
    let size = parseInt(req.query.size) || 20
    let skip = page * size

    // get total count for paging
    let getCount = new Promise(function(resolve, reject){
      db.queryOne(`select count(id) as count
                  from person`,
                  null, resolve, reject)
    })

    // get rows
    let getItems = new Promise((resolve, reject) => {
      db.query(`select p.id, p.name, pl.name as level, s.name as state, l.name as lga
                from person p
                left outer join person_level pl on p.person_level_id = pl.id
                left outer join state s on p.state_id = s.id
                left outer join lga l on p.lga_id = l.id
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
