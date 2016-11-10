let Joi = require('joi')
let { asyncHandler, validateSortPageParams } = require('../routes')
let { listInventoryItems } = require('./service')

module.exports = [
  {
    method: 'GET',
    path: '/inventory',
    handler: asyncHandler(listInventoryItems),
    config: {
      description: 'Inventory List',
      notes: 'Pageable and sortable list of inventory items',
      auth: {scope :['inventory:view', 'inventory:edit']},
      validate: {
        query: Object.assign({
          consumableId: Joi.number().integer().positive().allow('', null),
          siteName: Joi.string().allow('', null)
        }, validateSortPageParams())
      }
    }
  }
]
