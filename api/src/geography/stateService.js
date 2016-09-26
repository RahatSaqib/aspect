let { query } = require('../db')

function* stateSelectList(request){
  let data = yield query('Get states for select list').from('state as s')
    .where({'s.country_id': request.params.countryId})
    .orderBy('name', 'asc')
    .select('s.id', 's.name')

  let result = {ok: true, data}

  return result
}

module.exports = {
  stateSelectList
}
