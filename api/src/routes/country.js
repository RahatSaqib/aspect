let camelize = require('camelize')
let { query } = require('../db')
let { asyncHandler } = require('../util')

module.exports = [{
  method: 'GET',
  path: '/country/select-list',
  handler: asyncHandler(countrySelectList),
  config: {
    description: 'List of countries for selct list',
    notes: 'List of {id, name} objects'
  }
}]

function* countrySelectList(){
  let data = yield query('Get countries for select list').from('country as c')
    .orderBy('name', 'asc')
    .select('c.id', 'c.name')

  let result = {ok: true, data}

  return camelize(result)
}
