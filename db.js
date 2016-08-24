let mysql = require('mysql')

let config = require('./config')
let util = require('./util')

let pool = mysql.createPool(config.db)

// initialize knex
let knex = require('knex')({
  client: 'mysql',
  connection: config.db
})
module.exports.knex = knex

// extracts the parameters related to sorting and paging from the query
// string and modifies the query builder with the sort modifications
function requestSortPage(queryBuilder, request, defaultSort) {
  let sp = util.getSortPageParams(request, defaultSort)
  queryBuilder.orderBy(sp.sortCol, sp.sortDir).limit(sp.size).offset(sp.skip)
}
module.exports.requestSortPage = requestSortPage

// extracts the parameters related to filtering from the query
// string and modifies the query builder with the filter modifications
function requestFilter(queryBuilder, request, paramName, columnName = paramName) {
  let { query } = request
  if (query[paramName]) {
    queryBuilder.where(columnName, 'like', `%${query[paramName]}%`)
  }
}
module.exports.requestFilter = requestFilter

// select one or more rows
module.exports.find = function(tableName, columns, whereParams, resolve, reject) {
  columns = columns || '*'
  let query = 'select ' + columns + ' from ' + tableName

  if (whereParams){
    query += ' where ?'
  }

  exec(query, whereParams, resolve, reject, 'find')
}

// select exactly one row. throws error if none found or more than one
module.exports.findOne = function(tableName, columns, params, resolve, reject) {
  columns = columns || '*'
  let query = 'select ' + columns + ' from ' + tableName + ' where ?'
  exec(query, params, resolve, reject, 'findOne', tableName)
}

// insert new row into a table
module.exports.insert = function(tableName, params, resolve, reject) {
  let query = 'insert into ' + tableName + ' SET ?'
  exec(query, params, resolve, reject, 'insert')
}

// update a table
module.exports.update = function(tableName, params, resolve, reject) {
  let query = 'update ' + tableName + ' SET ? WHERE ?'
  exec(query, params, resolve, reject, 'update')
}

// pass in any query, but expect exactly one result
module.exports.queryOne = function(query, params, resolve, reject) {
  exec(query, params, resolve, reject, 'findOne')
}

// can pass in any query here. mode-param is optional.
module.exports.query = function(query, params, resolve, reject, mode) {
  exec(query, params, resolve, reject, mode || 'find')
}

// execute a database query. mode and tablename are optional.
function exec(query, params, resolve, reject, mode, tableName) {
  pool.getConnection(function(err, connection) {

    if (err) {
      if (connection) {
        connection.release()
      }

      console.error('CONNECTION error: ', err)

      resolve({ ok: false, err: err.code })

    } else {
      connection.query(query, params, function(err, result) {
        // did the query error out?
        if (err) {
          console.log(err)
          let error = { ok: false, err: err.code }
          reject ? reject(error) : resolve(error)
        } else {
          switch (mode) {

          case 'findOne':
            let ok = result.length == 1
            let ret = {
              ok: ok,
              data: ok ? result[0] : null,
              message: ok ? null : tableName ? tableName + ' not found' : 'not found'
            }

            ret.ok ? resolve(ret) : (reject ? reject(ret) : resolve(ret))

            break

          case 'insert':
            resolve({
              ok: true,
              id: result.insertId
            })
            break

          case 'update':
            resolve({
              ok: true,
              length: result.changedRows
            })
            break

          default:
            resolve({
              ok: true,
              data: result,
              length: result.length
            })
            break
          }
        }
        connection.release()
      })
    }
  })
}
