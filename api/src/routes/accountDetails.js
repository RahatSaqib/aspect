let camelize = require('camelize')
let { query } = require('../db')
let { asyncHandler } = require('../util')

module.exports = [
  {
    method: 'GET',
    path: '/account-details/current',
    handler: asyncHandler(getAccountDetailsForLoggedInUser),
    config: {
      description: 'Get The Person Objects Linked to the Logged In User\'s Profile',
      notes: 'Returns a list of people'
    }
  }
]

function* getAccountDetailsForLoggedInUser(request){
  //TODO: Add migration for ZIP code
  let data = yield query('Get account details for currently logged in user').from('user as u')
    .leftJoin('person as p', 'u.id', 'p.user_id')
    .where({'u.name': request.auth.credentials.name})
    .first('p.id', 'p.user_id', 'u.name as username', 'p.name', 'p.title', 'p.email', 'p.email2',
      'p.phone', 'p.cell', 'p.country_id', 'p.state_id', 'p.lga_id', 'p.timezone', 'p.culture')

  let result = {ok: true, data}

  return camelize(result)
}
