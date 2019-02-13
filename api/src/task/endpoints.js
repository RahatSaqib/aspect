const Joi = require('joi')
const { asyncHandler, validateSortPageParams } = require('../routes')
const { listTasks, listTasksByStatus } = require('./service')

const routes = [
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
  {
    method: 'GET',
    path: '/taskbystatus',
    handler: asyncHandler(listTasksByStatus),
    config: {
      description: 'Task List by status',
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
            siteId: Joi.number().allow(''),
            date: Joi.date().iso(),
            categoryId: Joi.number(),
          },
          validateSortPageParams('topic', 'site', 'time')
        ),
      },
    },
  },
]

module.exports = { routes }
