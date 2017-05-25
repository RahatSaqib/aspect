const Joi = require('joi')
const {
  asyncHandler,
  validateDateRangeParams,
  validateSortPageParams
} = require('../routes')
const {
  listResults,
  showResult,
  listResultTypes,
  updateWorkflowStatus,
  listWorkflowStatusTypes,
  listWorkflowStatusLog,
  exportResults
} = require('./service')
const { validateAllGeographyFilterParams } = require('../geography/requestValidation')

function listResultsBaseConfig() {
  return {
    auth: { scope: ['result:view', 'result:edit'] },
    validate: {
      query: Object.assign({
        deviceId: Joi.number().allow('').description('Filter for device ID'),
        assayId: Joi.number().allow('').description('Filter for assay ID'),
        resultCategoryId: Joi.number().allow('').description('Result Category ID'),
        deviceName: Joi.string().allow('').description('Filter for device name'),
        siteName: Joi.string().allow('').description('Filter for site name'),
        patientOrResearchId: Joi.string().allow('').description('Filter for patient/research ID'),
        sampleId: Joi.string().allow('').description('Filter for sample ID'),
        sampleGroup: Joi.string().allow('').description('Filter for sample group'),
        sampleOriginSite: Joi.string().allow('').description('Filter for sample origin site ID'),
        workflowStatusId: Joi.number().allow('').description('Filter for Result Workflow Status ID'),
        jsonFields: Joi.array().max(10).items(Joi.string().max(50)).single().description('Specify which fields to select from the resultDataJSON')
      }, validateAllGeographyFilterParams(),
        validateDateRangeParams(),
        validateSortPageParams())
    }
  }
}

module.exports = [
  {
    method: 'GET',
    path: '/result',
    handler: asyncHandler(listResults),
    config: Object.assign({
      description: 'Result List',
      notes: 'Pageable and sortable list of results'
    }, listResultsBaseConfig())
  },
  {
    method: 'GET',
    path: '/result/{resultId}',
    handler: asyncHandler(showResult),
    config: {
      description: 'Result Detail',
      notes: 'Details of a result',
      auth: { scope: ['result:view', 'result:edit'] },
      validate: {
        params: {
          resultId: Joi.string().description('Result ID').required()
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/result/result-types',
    handler: asyncHandler(listResultTypes),
    config: {
      description: 'Result Type List',
      notes: 'Pageable and sortable list of results types',
      auth: { scope: ['result:view', 'result:edit'] },
      validate: {
        query: Object.assign({
          name: Joi.string().allow('').description('Filter for result type name')
        }, validateSortPageParams('name'))
      }
    }
  },
  {
    method: 'PUT',
    path: '/result/workflow-status/{resultId}',
    handler: asyncHandler(updateWorkflowStatus),
    config: {
      description: 'Update Result Status',
      notes: 'Update the status of a result',
      auth: { scope: ['result:edit'] },
      validate: {
        params: {
          resultId: Joi.number().integer().positive().description('Result Id')
        },
        payload: {
          resultWorkflowStatusId: Joi.number().integer().allow(null),
          token: Joi.string().allow('', null)
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/result/workflow-status-types',
    handler: asyncHandler(listWorkflowStatusTypes),
    config: {
      description: 'Result Workflow Status List',
      notes: 'Dictionary set of Result Workflow Status options',
      auth: { scope: ['result:view', 'result:edit'] }
    }
  },
  {
    method: 'GET',
    path: '/result/workflow-status-logs/{resultId}',
    handler: asyncHandler(listWorkflowStatusLog),
    config: {
      description: 'Result Workflow Status Logs',
      notes: 'Pageable and sortable list of workflow status logs for current result',
      auth: { scope: ['result:view', 'result:edit'] },
      validate: {
        query: validateSortPageParams(),
        params: {
          resultId: Joi.string().description('Result ID').required()
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/result/export',
    handler: asyncHandler(exportResults),
    config: Object.assign({
      description: 'Export Result List into Excel or CSV',
      notes: 'Filtered and sorted list of devices'
    }, listResultsBaseConfig())
  }

]
