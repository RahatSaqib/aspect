let { asyncHandler } = require('../routes')
let { buildGeographySelectList } = require('./service')

module.exports = [
  {
    method: 'GET',
    path: '/geography/select-list',
    handler: asyncHandler(buildGeographySelectList),
    config: {
      description: 'Country List',
      notes: 'List of countries with nested states and LGAs'
    }
  }
]
