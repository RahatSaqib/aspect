const Joi = require('@hapi/joi')
const {
  asyncHandler,
  validateDateRangeParams,
  validateSortPageParams,
} = require('../routes')
const { getReports, listReports, proxyGxReport } = require('./service')
const { createReport, exportReports } = require('./serviceReports')
const {
  validateAllGeographyFilterParams,
} = require('../geography/requestValidation')

function listReportBaseConfig() {
  return {
    auth: { scope: ['report:view'] },
    validate: {
      query: {
        format: Joi.string()
          .allow('')
          .description('File format for exporting data'),

        contactNameOrEmail: Joi.string()
          .allow('')
          .description('Filter for report name'),
        ...validateSortPageParams(
          'name',
          'deploymentName',
          'moduleSerial',
          'dateOfError',
          'error',
          'totalTestsRun',
          'totalErrors'
        ),
      },
    },
  }
}

function requestBaseQuery() {
  return {
    ...validateAllGeographyFilterParams(),
    ...validateDateRangeParams(),
    maxDate: Joi.date()
      .iso()
      .allow(null)
      .description('To Date')
      .default(new Date().toISOString()),
    siteName: Joi.string().allow('').description('Filter for site name'),
    reportName: Joi.string().allow('').description('Filter for report name'),
  }
}

function responseBaseReports() {
  return {
    options: {
      allowUnknown: false,
    },
    schema: Joi.object().keys({
      ok: Joi.bool()
        .required()
        .description('False if there was some sort of error'),
      total: Joi.number().required(),
      data: Joi.array()
        .required()
        .description('List of reports')
        .items(
          Joi.object().keys({
            name: Joi.string().required().description('Report name'),
            description: Joi.string()
              .required()
              .description('Report description'),
            externalId: Joi.string()
              .required()
              .description('Report unique externalId'),
            sortOrder: Joi.number().required().description('Report sort order'),
            i18nKey: Joi.string()
              .allow(null)
              .description('the i18n key of the report title'),
            i18nKeyDescription: Joi.string()
              .allow(null)
              .description('the i18n key of the report description'),
            exportExcel: Joi.number()
              .allow(null)
              .description('Flag to allow export to excel'),
            exportCsv: Joi.number()
              .allow(null)
              .description('Flag to allow export to csv'),
          })
        ),
    }),
  }
}

const routes = [
  {
    method: 'GET',
    path: '/reports',
    handler: asyncHandler(getReports),
    config: {
      description: 'List of Reports',
      notes: 'Reports scoped by user permissions, filterable by geography',
      auth: { scope: ['report:view'] },
      validate: {
        query: {
          ...requestBaseQuery(),
        },
      },
      response: {
        ...responseBaseReports(),
      },
    },
  },
  {
    method: 'GET',
    path: '/reports/{externalId}',
    handler: createReport,
    config: {
      description: 'Report Excel file',
      notes:
        'Returns Excel file generated from template corresponding to externalId',
      auth: { scope: ['report:view'] },
      validate: {
        query: {
          ...requestBaseQuery(),
          format: Joi.string()
            .allow('', null, 'xlsx', 'csv')
            .description('File format for exporting data'),
        },
        params: {
          externalId: Joi.string()
            .description('Value of externalId in table Report')
            .required(),
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/report',
    handler: asyncHandler(listReports),
    config: {
      description: 'Report List',
      notes: 'Pageable and sortable list of reports',
      ...listReportBaseConfig(),
    },
  },
  {
    method: 'GET',
    path: '/report/export',
    handler: exportReports,
    config: {
      description: 'Export Report List into Excel or CSV',
      notes: 'Filtered and sorted list of Report',
      ...listReportBaseConfig(),
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
          fileName: Joi.string().description('File name').required(),
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
          reportName: Joi.string().description('Report name').required(),
        },
        query: {
          siteId: Joi.string().allow('').description('Filter for site ID'),
          dateFrom: Joi.string().allow(''),
          dateTo: Joi.string().allow(''),
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/report/select-list',
    handler: asyncHandler(getReports),
    config: {
      description: 'Reports for Select List',
      notes: "List of report externalID's and names",
      auth: { scope: ['report:view'] },
      response: {
        ...responseBaseReports(),
      },
    },
  },
]

module.exports = { routes }
