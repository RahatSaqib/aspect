const { asyncHandler } = require('../routes')
const { getJobFunctionsForSelectList } = require('./service')

module.exports = [
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
