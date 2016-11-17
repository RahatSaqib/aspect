const { asyncHandler } = require('../routes')
const { getRolesForSelectList } = require('./service')

module.exports = [
  {
    method: 'GET',
    path: '/role/select-list',
    handler: asyncHandler(getRolesForSelectList),
    config: {
      description: 'Roles for Select List',
      notes: 'Tree structure of Partners, Organisational Units and Roles',
      auth: { scope: ['person'] }
    }
  }
]
