const Joi = require('joi')
const { asyncHandler, validateSortPageParams } = require('../routes')
const { listResults, listResultTypes } = require('./service')

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
          deviceName: Joi.string().allow('').description('Filter for device name')
        }, validateSortPageParams('lastTestOn', 'deviceName', 'state', 'lga', 'patiendId', 'resultText'))
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
