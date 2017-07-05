const { asyncHandler } = require('../routes')
const { homeDashboard } = require('./service')

module.exports = [
  {
    method: 'GET',
    path: '/dashboard',
    handler: asyncHandler(homeDashboard),
    config: {
      description: 'Dashboard Home',
      notes: 'The top level dashboard',
      auth: { scope: ['site', 'device'] },
    },
  },
]
