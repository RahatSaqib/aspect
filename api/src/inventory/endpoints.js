let Joi = require('joi')
let { asyncHandler, validateSortPageParams } = require('../routes')
let { listConsumableTypes, listConsumableReasons } = require('./service')

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
          name: Joi.string().allow('').description('Filter for consumable type')
        }, validateSortPageParams('name'))
      }
    }
  },
  {
    method: 'GET',
    path: '/inventory/consumable-reason',
    handler: asyncHandler(listConsumableReasons),
    config: {
      description: 'Consumable Reason',
      notes: 'Pageable and sortable list for reaons that a consumable was used',
      auth: {scope :['inventory:view', 'inventory:edit']},
      validate: {
        query: Object.assign({
          name: Joi.string().allow('').description('Filter for consumable reason')
        }, validateSortPageParams('name'))
      }
    }
  }
]