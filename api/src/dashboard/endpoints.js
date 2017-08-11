const { asyncHandler } = require('../routes')
const { statusDashboard } = require('./service')

module.exports = [
  {
    method: 'GET',
    path: '/dashboard',
    handler: asyncHandler(statusDashboard),
    config: {
      description: 'Dashboard Home',
      notes: 'The top level dashboard',
      auth: { scope: ['site', 'device'] },
    },
  },
]
