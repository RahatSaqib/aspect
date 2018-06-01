const Joi = require('joi')
const { asyncHandler, validateSortPageParams } = require('../routes')
const { listReports, proxyGxReport } = require('./service')

const routes = [
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
  {
    method: 'GET',
    path: '/report/{fileName}',
    handler: {
      file(request) {
        return `./placeholders/${request.params.fileName}`
      },
    },
    config: {
      description: 'Report Placeholder',
      notes: 'Returns a static report file as a placeholder',
      auth: false,
      validate: {
        params: {
          fileName: Joi.string()
            .description('File name')
            .required(),
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/report/gx/{fileName}',
    handler: proxyGxReport,
    config: {
      description: 'Report Placeholder',
      notes: 'Returns a static report file as a placeholder',
      auth: false,
      validate: {
        params: {
          fileName: Joi.string()
            .description('File name')
            .required(),
        },
      },
    },
  },
]

module.exports = { routes }
