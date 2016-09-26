let { query } = require('../db')

function* lgaSelectList(request){
  let data = yield query('Get LGAs for select list').from('lga as l')
    .where({'l.state_id': request.params.stateId})
    .orderBy('name', 'asc')
    .select('l.id', 'l.name')

  let result = {ok: true, data}

  return result
}

module.exports = {
  lgaSelectList
}
