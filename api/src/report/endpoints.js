const Joi = require('@hapi/joi')
const { pick } = require('lodash')
const { asyncHandler, validateDateRangeParams, validateSortPageParams } = require('../routes')
const {
  getReports,
  proxyGxReport,
  getAsyncReportRequest,
  getAsyncReportRequestWithReportsFilter,
} = require('./service')
const downloadReport = require('./downloadReport')
const downloadScheduledReport = require('./downloadScheduledReport')
const { validateAllGeographyFilterParams } = require('../geography/requestValidation')
const { responseAsyncReports } = require('./validation/response')
const { processAsyncReportRequest } = require('./processAsyncReportRequest')

function requestBaseQuery() {
  return {
    ...validateAllGeographyFilterParams(),
    ...validateDateRangeParams(),
    consumableId: Joi.number().integer().positive().allow('', null),
    siteName: Joi.string().allow('').description('Filter for site name'),
    reportName: Joi.string().allow('').description('Filter for report name'),
    assayId: Joi.alternatives()
      .try(Joi.array().items(Joi.number()), Joi.number())
      .allow(null, '')
      .description('Filter for assay ID(s)'),
    timeZone: Joi.string().allow('').description('IANA Timezone for requester'),
  }
}

function responseBaseReports() {
  return {
    options: {
      allowUnknown: false,
    },
    schema: Joi.object().keys({
      ok: Joi.bool().required().description('False if there was some sort of error'),
      total: Joi.number().required(),
      data: Joi.array()
        .required()
        .description('List of reports')
        .items(
          Joi.object().keys({
            name: Joi.string().required().description('Report name'),
            description: Joi.string().required().description('Report description'),
            externalId: Joi.string().required().description('Report unique externalId'),
            sortOrder: Joi.number().required().description('Report sort order'),
            i18nKey: Joi.string().allow(null).description('the i18n key of the report title'),
            i18nKeyDescription: Joi.string().allow(null).description('the i18n key of the report description'),
            exportExcel: Joi.number().allow(null).description('Flag to allow export to excel'),
            exportCsv: Joi.number().allow(null).description('Flag to allow export to csv'),
            validations: Joi.array().items(Joi.string()),
            parameters: Joi.array()
              .required()
              .description('Declared user-facing parameters for this report')
              .items(
                Joi.object().keys({
                  name: Joi.string()
                    .required()
                    .description('Wire key of the parameter (dateRange is virtual: minDate/maxDate)'),
                  type: Joi.string()
                    .valid(
                      'dateRange',
                      'state',
                      'lga',
                      'site',
                      'assay',
                      'consumable',
                      'enum',
                      'number',
                      'text',
                      'boolean'
                    )
                    .required(),
                  required: Joi.bool().description('Server-enforced in strict mode (phase 4); UI hint now'),
                  multiple: Joi.bool().description('Multi-select (arrays accepted)'),
                  default: Joi.alternatives()
                    .try(Joi.string(), Joi.number(), Joi.bool(), Joi.object().keys({ period: Joi.string().required() }))
                    .description('Literal for scalars; { period: <dateToken> } for dateRange'),
                  dependsOn: Joi.string().description('Name of the parameter this one cascades from'),
                  permission: Joi.string().description('Web hides the field unless user has this permission'),
                  i18nKey: Joi.string().description('Message key for the label (web/src/messages)'),
                  label: Joi.string().description('Fallback English label'),
                  options: Joi.array()
                    .items(Joi.alternatives().try(Joi.string(), Joi.number()))
                    .description('Allowed values for enum type'),
                  min: Joi.number().description('Min for number type'),
                  max: Joi.number().description('Max for number type'),
                })
              ),
          })
        ),
    }),
  }
}

const routes = [
  {
    method: 'GET',
    path: '/reports',
    handler: getReports,
    config: {
      description: 'List of Reports',
      notes: 'Reports scoped by user permissions, filterable by geography',
      auth: { scope: ['report:view'] },
      validate: {
        query: {
          ...requestBaseQuery(),
          availableForNotification: Joi.number().optional(),
        },
      },
      response: {
        ...responseBaseReports(),
      },
    },
  },
  {
    method: 'GET',
    path: '/reports/download',
    handler: downloadScheduledReport,
    config: {
      description: 'Report Excel file',
      notes: 'Returns Excel file generated from report based notification',
      auth: false,
      validate: {
        query: {
          token: Joi.string().description('Report token').required(),
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/reports/{externalId}',
    handler: downloadReport,
    config: {
      description: 'Report Excel file',
      notes: 'Returns Excel file generated from template corresponding to externalId',
      auth: { scope: ['report:view'] },
      validate: {
        // ad-hoc per-report parameters pass through; the strict params validator rejects undeclared keys
        query: Joi.object({
          ...requestBaseQuery(),
          format: Joi.string().allow('', null, 'xlsx', 'csv').description('File format for exporting data'),
        }).unknown(true),
        params: {
          externalId: Joi.string().description('Value of externalId in table Report').required(),
        },
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
  {
    method: 'POST',
    path: '/reports/{externalId}/async',
    handler: processAsyncReportRequest,
    config: {
      description: 'Process report asynchronously',
      notes: 'Returns a list of reports requested by the user within the last 24 hours',
      auth: { scope: ['report:view'] },
      validate: {
        payload: {
          // ad-hoc per-report parameters pass through; the strict params validator rejects undeclared keys
          reportsFilter: Joi.object({
            ...requestBaseQuery(),
          }).unknown(true),
          ...pick(requestBaseQuery(), ['timeZone']),
          format: Joi.string().allow('', null, 'xlsx', 'csv').description('File format for exporting data'),
        },
        params: {
          externalId: Joi.string().description('Value of externalId in table Report').required(),
        },
      },
    },
  },
  {
    method: 'POST',
    path: '/reports/async',
    handler: getAsyncReportRequestWithReportsFilter,
    config: {
      description: 'List of Async Reports',
      notes: 'Reports requested by user',
      auth: { scope: ['report:view'] },
      validate: {
        payload: {
          reportsFilter: Joi.object().unknown(true).description('Report filters'),
        },
      },
      response: {
        ...responseAsyncReports(),
      },
    },
  },
  {
    method: 'GET',
    path: '/reports/async',
    handler: getAsyncReportRequest,
    config: {
      description: 'List of Async Reports',
      notes: 'Reports requested by user',
      auth: { scope: ['report:view'] },
      validate: {
        query: {
          ...validateDateRangeParams(),
          ...validateSortPageParams(),
          status: Joi.string().optional().description('Status ID'),
        },
      },
      response: {
        ...responseAsyncReports(),
      },
    },
  },
]

module.exports = { routes }
