const Joi = require('joi')
const { asyncHandler, validateSortPageParams } = require('../routes')
const { listResults, showResult, listResultTypes } = require('./service')

module.exports = [
  {
    method: 'GET',
    path: '/result',
    handler: asyncHandler(listResults),
    config: {
      description: 'Result List',
      notes: 'Pageable and sortable list of results',
      auth: {scope: ['result:view', 'result:edit']},
      validate: {
        query: Object.assign({
          sampleId: Joi.string().allow('').description('Filter for sample ID'),
          assayId: Joi.string().allow('').description('Filter for assay ID'),
          jsonFields: Joi.any().allow('').description('Specify which fields to select from the resultDataJSON')
        }, validateSortPageParams('ended', 'deviceName', 'stateName', 'lgaName', 'sampleId', 'patientId'))
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
      auth: {scope: ['result:view', 'result:edit']},
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
      auth: {scope: ['result:view', 'result:edit']},
      validate: {
        query: Object.assign({
          name: Joi.string().allow('').description('Filter for result type name')
        }, validateSortPageParams('name'))
      }
    }
  }
]
