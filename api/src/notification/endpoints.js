const Joi = require('joi')
const { asyncHandler, validateSortPageParams } = require('../routes')
const { listNotifications } = require('./service')

module.exports = [{
  method: 'GET',
  path: '/notification',
  handler: asyncHandler(listNotifications),
  config: {
    description: 'Notification List',
    notes: 'Pageable and sortable list of notifications',
    auth: { scope: ['notification:view', 'notification:edit'] },
    validate: {
      query: Object.assign({
        contactNameOrEmail: Joi.string().allow('').description('Filter for notification name')
      }, validateSortPageParams('type', 'name', 'assignedContacts'))
    }
  }
}]
