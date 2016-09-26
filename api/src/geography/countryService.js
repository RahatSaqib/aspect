let { query } = require('../db')

function* countrySelectList(){
  let data = yield query('Get countries for select list').from('country as c')
    .orderBy('name', 'asc')
    .select('c.id', 'c.name')

  let result = {ok: true, data}

  return result
}

module.exports = {
  countrySelectList
}
