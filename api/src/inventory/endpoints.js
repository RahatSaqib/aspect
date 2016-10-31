let Joi = require('joi')
let { asyncHandler, validateSortPageParams } = require('../routes')
let { listConsumableTypes } = require('./service')

module.exports = [
  {
    method: 'GET',
    path: '/inventory/consumable-types',
    handler: asyncHandler(listConsumableTypes),
    config: {
      description: 'Consumable Types',
      notes: 'Pageable and sortable list of consumable types',
      auth: {scope: ['inventory:view', 'inventory:edit']},
      validate: {
        query: Object.assign({
          name: Joi.string().allow('').description('Filter for assay name')
        }, validateSortPageParams('name'))
      }
    }
  }
]
