let { countrySelectList } = require('./countryService')
let { asyncHandler } = require('../routes')

module.exports = [{
  method: 'GET',
  path: '/country/select-list',
  handler: asyncHandler(countrySelectList),
  config: {
    description: 'List of countries for select list',
    notes: 'List of {id, name} objects'
  }
}]
