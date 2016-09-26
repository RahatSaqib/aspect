let { query } = require('../db')
let { asyncHandler } = require('../routes')
let Joi = require('joi')

module.exports = [{
  method: 'GET',
  path: '/state/select-list/{countryId}',
  handler: asyncHandler(stateSelectList),
  config: {
    description: 'List of states for select list',
    notes: 'List of {id, name} objects',
    validate: {
      params: {
        countryId: Joi.string().description('Country ID').required()
      }
    }
  }
}]

function* stateSelectList(request){
  let data = yield query('Get states for select list').from('state as s')
    .where({'s.country_id': request.params.countryId})
    .orderBy('name', 'asc')
    .select('s.id', 's.name')

  let result = {ok: true, data}

  return result
}
