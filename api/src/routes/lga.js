let { query } = require('../db')
let { asyncHandler } = require('../util')
let Joi = require('joi')

module.exports = [{
  method: 'GET',
  path: '/lga/select-list/{stateId}',
  handler: asyncHandler(lgaSelectList),
  config: {
    description: 'List of LGAs for select list',
    notes: 'List of {id, name} objects',
    validate: {
      params: {
        stateId: Joi.string().description('State ID').required()
      }
    }
  }
}]

function* lgaSelectList(request){
  let data = yield query('Get LGAs for select list').from('lga as l')
    .where({'l.state_id': request.params.stateId})
    .orderBy('name', 'asc')
    .select('l.id', 'l.name')

  let result = {ok: true, data}

  return result
}
