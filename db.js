let mysql = require('mysql')

let config = require('./config')

let pool = mysql.createPool(config.db)

function exec(query, params, callback, mode) {
  pool.getConnection(function(err, connection) {
    if (err) {

      if (connection) {
        connection.release()
      }

      console.error('CONNECTION error: ', err)
      callback({
        result: 'error',
        err: err.code
      })
    } else {
      connection.query(query, params, function(err, result) {
        if (err) {
          console.error(err)

          callback({
            result: 'error',
            err: err.code
          })
        } else {
          switch (mode) {
          case 'findOne':
            callback({
              result: result.length == 1 ? 'success' : 'error',
              data: result.length == 1 ? result[0] : null
            })
            break

          case 'insert':
            callback({
              result: 'success',
              id: result.insertId
            })
            break

          case 'update':
            callback({
              result: 'success',
              length: result.changedRows
            })
            break

          default:
            callback({
              result: 'success',
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

module.exports.find = function(tableName, columns, params, callback) {

  columns = columns || '*'

  let query = 'select ' + columns + ' from ' + tableName + ' where ?'

  exec(query, params, callback, 'find')

}

module.exports.findOne = function(tableName, columns, params, callback) {

  columns = columns || '*'

  let query = 'select ' + columns + ' from ' + tableName + ' where ?'

  exec(query, params, callback, 'findOne')

}

module.exports.insert = function(tableName, params, callback) {

  let query = 'insert into ' + tableName + ' SET ?'

  exec(query, params, callback, 'insert')

}

module.exports.update = function(tableName, params, callback) {

  let query = 'update ' + tableName + ' SET ? WHERE ?'

  exec(query, params, callback, 'update')

}

module.exports.query = function(query, params, callback) {

  exec(query, params, callback, 'find')

}
