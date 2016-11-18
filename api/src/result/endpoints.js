const Joi = require('joi')
const { asyncHandler, validateSortPageParams } = require('../routes')
const { listResults, showResult, listResultTypes, updateWorkflowStatus } = require('./service')

module.exports = [
  {
    method: 'GET',
    path: '/result',
    handler: asyncHandler(listResults),
    config: {
      description: 'Result List',
      notes: 'Pageable and sortable list of results',
      auth: { scope: ['result:view', 'result:edit'] },
      validate: {
        query: Object.assign({
          deviceId: Joi.number().allow('').description('Filter for device ID'),
          assayId: Joi.number().allow('').description('Filter for assay ID'),
          resultCategoryId: Joi.number().allow('').description('Result Category ID'),
          minDate: Joi.date().iso().allow(null).description('Start on'),
          maxDate: Joi.date().iso().allow(null).description('End on'),
          countryId: Joi.number().allow('').description('Country ID'),
          stateId: Joi.number().allow('').description('State ID'),
          lgaId: Joi.number().allow('').description('LGA ID'),
          deviceName: Joi.string().allow('').description('Filter for device name'),
          siteName: Joi.string().allow('').description('Filter for site name'),
          sampleId: Joi.number().allow('').description('Filter for sample ID'),
          jsonFields: Joi.array().max(10).items(Joi.string().max(50)).single().description('Specify which fields to select from the resultDataJSON')
        }, validateSortPageParams())
      }
    }
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
  }
]
