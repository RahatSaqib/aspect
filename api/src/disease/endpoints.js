const { asyncHandler } = require('../routes')
const { listDiseases } = require('./service')

const routes = [
  {
    method: 'GET',
    path: '/diseases',
    handler: asyncHandler(listDiseases),
    config: {
      description: 'Disease List',
      notes: 'List of assay types',
      auth: { scope: ['assay'] },
    },
  },
]

module.exports = { routes }
