const Joi = require('@hapi/joi')
const { asyncHandler, validateSortPageParams } = require('../routes')
const { listTasks, listTasksByStatus, getTask } = require('./service')

const routes = [
  {
    method: 'GET',
    path: '/task',
    handler: asyncHandler(listTasks),
    config: {
      description: 'Task List',
      notes: 'Pageable and sortable list of tasks',
      auth: { scope: ['task'] },
      validate: {
        query: {
          alertType: Joi.string()
            .allow('')
            .description('Filter for alert type'),
          issueCategory: Joi.string()
            .allow('')
            .description('Filter for issue category'),
          deviceId: Joi.number()
            .integer()
            .allow(null)
            .description('Filter for device id'),
          siteId: Joi.number()
            .integer()
            .allow(null)
            .description('Filter for site id'),
          ...validateSortPageParams('issueCategory', 'site', 'time'),
        },
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
                  .description(
                    'Returns the max alert message Id, it is only needed for the datatable'
                  ),
                alertTemplateId: Joi.number().required(),
                site: Joi.string().required().description('The site name'),
                issueStatus: Joi.string()
                  .required()
                  .description('The name of the issue status'),
                issueStatusI18nKey: Joi.string()
                  .required()
                  .description('The key i18n of the issue status'),
                issueStatusId: Joi.number()
                  .required()
                  .description('The id of the issue status'),
                issueCategory: Joi.string()
                  .required()
                  .description('The name of the issue category'),
                issueCategoryI18nKey: Joi.string()
                  .required()
                  .description('The key i18nkey of the issue category'),
                issueCategoryId: Joi.number()
                  .required()
                  .description('The id of the issue category'),
                time: Joi.date().required().description('Date for the alert'),
                message: Joi.string()
                  .allow(null)
                  .description('Message of the alert'),
                issueCount: Joi.number()
                  .optional()
                  .description('The amount of issues related to this alert'),
                title: Joi.string().required().description("The alert's title"),
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
      auth: { scope: ['task'] },
      validate: {
        query: {
          alertType: Joi.string()
            .allow('')
            .description('Filter for alert type'),
          topic: Joi.string().allow('').description('Filter for topic'),
          date: Joi.date().iso().description('Filter for the alert date'),
          categoryId: Joi.number().description('Filter for the issue category'),
          alertTemplateId: Joi.number().description(
            'Filter for the alert template'
          ),
          deviceId: Joi.string()
            // .integer()
            .allow(null, '')
            .description('Filter for device id'),
          siteId: Joi.number()
            .integer()
            .allow(null)
            .description('Filter for site id'),
          ...validateSortPageParams('topic', 'site', 'time'),
        },
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
                  .description('The id of the alert message'),
                site: Joi.string().required().description('The site name'),
                siteId: Joi.number().description('The site Id'),
                deviceId: Joi.number().description('The device Id'),
                device: Joi.string().description('The device name'),
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
                time: Joi.date().required().description('Date for the alert'),
                message: Joi.string()
                  .allow(null)
                  .description('Message of the alert'),
                issueCount: Joi.number()
                  .optional()
                  .description('The amount of issues related with this alert'),
                title: Joi.string().required().description("The alert's title"),
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
    path: '/task/{taskId}',
    handler: asyncHandler(getTask),
    config: {
      description: 'Task List',
      notes: 'details of the task for the current id',
      auth: { scope: ['task'] },
      validate: {
        params: {
          taskId: Joi.number().required().description('id number of the alert'),
        },
      },
      response: {
        options: {
          allowUnknown: true,
        },

        schema: {
          task: Joi.object()
            .keys({
              id: Joi.number()
                .required()
                .description('The id of the alert message'),
              site: Joi.string().required().description('The site name'),
              siteId: Joi.number().description('The site Id'),
              deviceId: Joi.number().description('The device Id'),
              device: Joi.string().description('The device name'),
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
              time: Joi.date().required().description('Date for the alert'),
              message: Joi.string()
                .allow(null)
                .description('Message of the alert'),
              personName: Joi.string().description(
                'The name of the site contact'
              ),
              title: Joi.string().required().description("The alert's title"),
              jobPersons: Joi.array().items(
                Joi.object().keys({
                  personName: Joi.string()
                    .required()
                    .description('Name of the person alerted'),
                  personId: Joi.string()
                    .required()
                    .description('Id of the person alerted'),
                })
              ),
            })
            .description('The task'),
          ok: Joi.boolean().description('The status of the request'),
        },
      },
    },
  },
]

module.exports = { routes }
