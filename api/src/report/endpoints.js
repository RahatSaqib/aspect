const Joi = require('joi')
const { asyncHandler, validateSortPageParams } = require('../routes')
const { listReports } = require('./service')

module.exports = [
  {
    method: 'GET',
    path: '/report',
    handler: asyncHandler(listReports),
    config: {
      description: 'Report List',
      notes: 'Pageable and sortable list of reports',
      auth: { scope: ['report:view', 'report:edit'] },
      validate: {
        query: Object.assign(
          {
            contactNameOrEmail: Joi.string()
              .allow('')
              .description('Filter for report name'),
          },
          validateSortPageParams(
            'name',
            'deploymentName',
            'moduleSerial',
            'dateOfError',
            'error',
            'totalTestsRun',
            'totalErrors'
          )
        ),
      },
    },
  },
]
