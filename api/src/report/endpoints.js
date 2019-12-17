const Joi = require('@hapi/joi')
const { asyncHandler, validateSortPageParams } = require('../routes')
const { listReports, proxyGxReport } = require('./service')
const { getReport } = require('./serviceReports')

function listReportBaseConfig() {
  return {
    auth: { scope: ['report:view', 'report:edit'] },
    validate: {
      query: Object.assign(
        {
          format: Joi.string()
            .allow('')
            .description('File format for exporting data'),

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
  }
}

const routes = [
  {
    method: 'GET',
    path: '/report',
    handler: asyncHandler(listReports),
    config: Object.assign(
      {
        description: 'Report List',
        notes: 'Pageable and sortable list of reports',
      },
      listReportBaseConfig()
    ),
  },
  {
    method: 'GET',
    path: '/report/export',
    handler: getReport,
    config: Object.assign(
      {
        description: 'Export Report List into Excel or CSV',
        notes: 'Filtered and sorted list of Report',
      },
      listReportBaseConfig()
    ),
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
    path: '/report/gx/{reportName}.xlsx',
    handler: proxyGxReport,
    config: {
      description: 'Gx Alert Reports',
      notes: 'Proxies reports from GxAlert',
      auth: { scope: ['site', 'device'] },
      timeout: {
        server: 300000,
        socket: false,
      },
      validate: {
        params: {
          reportName: Joi.string()
            .description('Report name')
            .required(),
        },
        query: {
          siteId: Joi.string()
            .allow('')
            .description('Filter for site ID'),
          dateFrom: Joi.string().allow(''),
          dateTo: Joi.string().allow(''),
        },
      },
    },
  },
]

module.exports = { routes }
