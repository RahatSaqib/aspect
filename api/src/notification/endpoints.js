const Joi = require('joi')
const { asyncHandler, validateSortPageParams } = require('../routes')
const { listNotifications, onIssueEscalated } = require('./service')
const { testPush } = require('./pushnotification/service')

const routes = [
  {
    method: 'GET',
    path: '/notification',
    handler: asyncHandler(listNotifications),
    config: {
      description: 'Notification List',
      notes: 'Pageable and sortable list of notifications',
      auth: { scope: ['notification:view', 'notification:edit'] },
      validate: {
        query: Object.assign(
          {
            notificationName: Joi.string()
              .allow('')
              .description('Filter for notification name'),
          },
          validateSortPageParams(
            'name',
            'lastTriggeredOn',
            'alertCount',
            'totalTriggers',
            'emailCount',
            'smsCount'
          )
        ),
      },
    },
  },
  {
    method: 'POST',
    path: '/testpushnotification',
    handler: asyncHandler(testPush),
    config: {
      description: 'Test for sending push notification to all devices',
      auth: { scope: ['notification:admin'] },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: Joi.object().keys({
          ok: Joi.bool()
            .required()
            .description(
              'False if there was some sort of error sending the push'
            ),
        }),
      },
    },
  },
]

const subscriptions = [
  {
    actions: {
      ISSUE_ESCALATED: onIssueEscalated,
    },
  },
]

module.exports = { routes, subscriptions }
