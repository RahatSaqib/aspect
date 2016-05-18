let mysql = require('mysql')

let config = require('./config')

let pool = mysql.createPool(config.db)

// select one or more rows
module.exports.find = function(tableName, columns, params, callback) {

  columns = columns || '*'

  let query = 'select ' + columns + ' from ' + tableName

  if (params){
    query += ' where ?'
  }

  exec(query, params, callback, 'find')

}

// select exactly one row. throws error if none found or more than one
module.exports.findOne = function(tableName, columns, params, callback) {

  columns = columns || '*'

  let query = 'select ' + columns + ' from ' + tableName

  if (params){
    query += ' where ?'
  }

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

// can pass in any query here
module.exports.query = function(query, params, callback) {

  exec(query, params, callback, 'find')

}

// execute a databsae query
function exec(query, params, callback, mode, tableName) {
  pool.getConnection(function(err, connection) {
    if (err) {

      if (connection) {
        connection.release()
      }

      console.error('CONNECTION error: ', err)

      callback({ result: 'error', err: err.code })
    } else {
      connection.query(query, params, function(err, result) {
        if (err) {
          console.error(err)
          callback({ result: 'error', err: err.code })
        } else {
          switch (mode) {
          case 'findOne':
            let ok = result.length == 1
            callback({
              result: ok ? 'success' : 'error',
              data: ok ? result[0] : null,
              message: ok ? null : tableName + ' not found'
            })
            break
          case 'insert':
            callback({ result: 'success', id: result.insertId })
            break
          case 'update':
            callback({ result: 'success', length: result.changedRows })
            break
          default:
            callback({ result: 'success', data: result, length: result.length })
            break
          }
        }
        connection.release()
      })
    }
  })
}
