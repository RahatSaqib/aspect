let mysql = require('mysql')

let config = require('./config')

let pool = mysql.createPool(config.db)

// select one or more rows
module.exports.find = function(tableName, columns, whereParams, callback) {

  columns = columns || '*'

  let query = 'select ' + columns + ' from ' + tableName

  if (whereParams){
    query += ' where ?'
  }

  exec(query, whereParams, callback, 'find')

}

// select exactly one row. throws error if none found or more than one
module.exports.findOne = function(tableName, columns, params, callback) {

  columns = columns || '*'

  let query = 'select ' + columns + ' from ' + tableName + ' where ?'

  exec(query, params, callback, 'findOne', tableName)

}

// insert new row into a table
module.exports.insert = function(tableName, params, callback) {

  let query = 'insert into ' + tableName + ' SET ?'

  exec(query, params, callback, 'insert')

}

// update a table
module.exports.update = function(tableName, params, callback) {

  let query = 'update ' + tableName + ' SET ? WHERE ?'

  exec(query, params, callback, 'update')

}

// pass in any query, but expect exactly one result
module.exports.queryOne = function(query, params, callback) {

  exec(query, params, callback, 'findOne')

}

// can pass in any query here
// mode-param is optional
module.exports.query = function(query, params, callback, mode) {

  exec(query, params, callback, mode || 'find')

}

// execute a database query
// mode and tableName are optional
function exec(query, params, callback, mode, tableName) {
  pool.getConnection(function(err, connection) {

    if (err) {

      if (connection) {
        connection.release()
      }

      console.error('CONNECTION error: ', err)

      callback({ ok: false, err: err.code })

    } else {
      connection.query(query, params, function(err, result) {
        if (err) {
          callback({
            ok: false,
            err: err.code
          })
        } else {

          switch (mode) {

          case 'findOne':
            let ok = result.length == 1
            callback({
              ok: ok,
              data: ok ? result[0] : null,
              message: ok ? null : tableName ? tableName + ' not found' : 'not found'
            })
            break

          case 'insert':
            callback({
              ok: true,
              id: result.insertId
            })
            break

          case 'update':
            callback({
              ok: true,
              length: result.changedRows
            })
            break

          default:
            callback({
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
