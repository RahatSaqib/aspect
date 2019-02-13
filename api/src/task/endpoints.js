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
      response: {
        options: {
          allowUnknown: true,
        },
        schema: {
          data: Joi.array()
            .allow(null)
            .items(
              Joi.object().keys({
                id: Joi.number()
                  .required()
                  .description('The id of the alarm message'),
                site: Joi.string()
                  .required()
                  .description('The site name'),
                issueStatus: Joi.string()
                  .required()
                  .description('The name of the issue status'),
                issueStatusId: Joi.number()
                  .required()
                  .description('The id of the issue status'),
                issueCategory: Joi.string()
                  .required()
                  .description('The name of the issue category'),
                issueCategoryId: Joi.number()
                  .required()
                  .description('The id of the issue category'),
                time: Joi.date()
                  .required()
                  .description('Date for the alarm'),
                message: Joi.string()
                  .allow(null)
                  .description('Message of the alert'),
                issueCount: Joi.number()
                  .optional()
                  .description('The amount of issues related with this alarm'),
                title: Joi.string()
                  .required()
                  .description("The alert's title"),
              })
            )
            .single(true)
            .description('The task list grouped by issueCategory and date'),
          total: Joi.number().description(
            'The amount of task for the personid in the database'
          ),
          countByAlert: Joi.object().description(
            'The amount of task grouped by type'
          ),
          length: Joi.number().description(
            'The amount of task present in this page'
          ),
          ok: Joi.boolean().description('The status of the request'),
        },
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
      response: {
        options: {
          allowUnknown: true,
        },
        schema: {
          data: Joi.array()
            .allow(null)
            .items(
              Joi.object().keys({
                id: Joi.number()
                  .required()
                  .description('The id of the alarm message'),
                site: Joi.string()
                  .required()
                  .description('The site name'),
                issueStatus: Joi.string()
                  .required()
                  .description('The name of the issue status'),
                issueStatusId: Joi.number()
                  .required()
                  .description('The id of the issue status'),
                issueCategory: Joi.string()
                  .required()
                  .description('The name of the issue category'),
                issueCategoryId: Joi.number()
                  .required()
                  .description('The id of the issue category'),
                time: Joi.date()
                  .required()
                  .description('Date for the alarm'),
                message: Joi.string()
                  .allow(null)
                  .description('Message of the alert'),
                issueCount: Joi.number()
                  .optional()
                  .description('The amount of issues related with this alarm'),
                title: Joi.string()
                  .required()
                  .description("The alert's title"),
              })
            )
            .single(true)
            .description('The task list grouped by issueCategory and date'),
          total: Joi.number().description(
            'The amount of task for the personid in the database'
          ),
          countByAlert: Joi.object().description(
            'The amount of task grouped by type'
          ),
          length: Joi.number().description(
            'The amount of task present in this page'
          ),
          ok: Joi.boolean().description('The status of the request'),
        },
      },
    },
  },
]

module.exports = { routes }
