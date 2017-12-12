const Joi = require('joi')
const { asyncHandler, validateSortPageParams } = require('../routes')
const { listTasks } = require('./service')

module.exports = [
  {
    method: 'GET',
    path: '/task',
    handler: asyncHandler(listTasks),
    config: {
      description: 'Task List',
      notes: 'Pageable and sortable list of tasks',
      auth: { scope: ['task:view', 'task:edit'] },
      validate: {
        query: Object.assign(
          {
            alertType: Joi.string()
              .allow('')
              .description('Filter for alert type'),
            topic: Joi.string()
              .allow('')
              .description('Filter for topic'),
          },
          validateSortPageParams('topic', 'site', 'time')
        ),
      },
    },
  },
]
