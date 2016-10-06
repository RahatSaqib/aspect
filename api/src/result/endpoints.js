const Joi = require('joi')
const { asyncHandler, validateSortPageParams } = require('../routes')
const { listResults } = require('./service')

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
  }
]
