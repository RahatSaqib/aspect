let decamelize = require('decamelize')

module.exports = {

  // extracts the parameters related to sorting and paging from the query
  // string and returns them as an object
  getSortPageParams: function(req, defaultSort){
    let params = {}

    req.sanitize('sortcol').trim()
    req.sanitize('sortDir').whitelist(['desc', 'asc'])
    req.sanitize('page').toInt()
    req.sanitize('size').toInt()

    params.sortCol = req.query.sortCol ? decamelize(req.query.sortCol) : defaultSort
    params.sortDir = req.query.sortDir == 'desc' ? 'desc' : 'asc'
    params.page = parseInt(req.query.page) || 0
    params.size = parseInt(req.query.size) || 20
    params.skip = params.page * params.size

    return params
  }
}
