const { asyncHandler } = require('../routes')
const { getJobFunctionsForSelectList } = require('./service')

const routes = [
  {
    method: 'GET',
    path: '/job-function/select-list',
    handler: asyncHandler(getJobFunctionsForSelectList),
    config: {
      description: 'Job Functions for Select List',
      notes: 'Tree structure of Partners and Job Functons',
      auth: { scope: ['person'] },
    },
  },
]

module.exports = { routes }
