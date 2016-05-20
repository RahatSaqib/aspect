let moment = require('moment')
let decamelize = require('decamelize')

module.exports = {
  // returns the current UTC date/time in a format that MySQL understands
  getUtcNowForMySql: function(){
    return moment().utc().format('YYYY-MM-DD HH:mm:ss')
  },

  getSortPageParams: function(req, defaultSort){

    let params = {}

    params.sortCol = req.query.sortCol ? decamelize(req.query.sortCol) : defaultSort
    params.sortDir = req.query.sortDir == 'desc' ? 'desc' : 'asc'
    params.page = parseInt(req.query.page) || 0
    params.size = parseInt(req.query.size) || 20
    params.skip = params.page * params.size

    return params
  }
}

