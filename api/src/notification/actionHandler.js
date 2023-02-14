const Promise = require('bluebird')
const _ = require('lodash')
const { createNotifications } = require('./service')
const NotificationCache = require('./notificationCache')
const { types: issueBasedTypes } = require('../issue/actions')
const { types: resultBasedTypes } = require('../result/actions')
const { types: reportBasedTypes } = require('../report/actions')
const { CATEGORY } = require('./constants')
const { issueTypeToId } = require('../shared/dictionary')

function getNotificationHandler() {
  return async (action, { messageContext: context }) => analyzeNotifications(context, action)
}

function issueBased() {
  return getNotificationHandler()
}

function resultBased() {
  return getNotificationHandler()
}

function reportBased() {
  return getNotificationHandler()
}

function getNotificationCategory({ type, issueId, resultId }) {
  if (type === issueBasedTypes.ISSUE_CREATED && issueId) {
    return CATEGORY.ISSUE_BASED
  }
  if (type === resultBasedTypes.RESULT_LOGGED && resultId) {
    return CATEGORY.RESULT_BASED
  }
  if (type === reportBasedTypes.REPORT_BASED_NOTIFICATION_REQUESTED) {
    return CATEGORY.REPORT_BASED
  }
  return null
}

async function getConditionsToEvaluate(knex, category) {
  const notificationCache = NotificationCache.getInstance(knex)
  let conditionsToEvaluate = []
  if (category === CATEGORY.ISSUE_BASED) {
    conditionsToEvaluate = await notificationCache.getCacheValueIssueNotification()
  } else if (category === CATEGORY.RESULT_BASED) {
    conditionsToEvaluate = await notificationCache.getCacheValueResultNotification()
  } else if (category === CATEGORY.REPORT_BASED) {
    conditionsToEvaluate = await notificationCache.getCacheValueReportNotification()
  }
  return conditionsToEvaluate
}

async function analyzeNotifications(context, action) {
  return context.run(async knex => {
    const { type, issueId, issueTypeId, resultId, isResultUpdated } = action

    const category = getNotificationCategory({ type, issueId, resultId })

    // HACK: Calibration notification must be avoided on issue creation and sent only when ISSUE_NOTIFICATION_TRIGGERED
    // event is dispatched
    const calibrationIssueTypeId = await issueTypeToId('CalibrationDueDate')
    if (issueTypeId === calibrationIssueTypeId && type !== 'ISSUE_NOTIFICATION_TRIGGERED') {
      return
    }

    const conditionsToEvaluate = await getConditionsToEvaluate(knex, category)
    
    await Promise.each(
      _.filter(conditionsToEvaluate, condition => {
        switch (category) {
          case CATEGORY.ISSUE_BASED: {
            /**
             * proceed only for this issue type
             */
            return condition.issueTypeId === issueTypeId
          }
          case CATEGORY.RESULT_BASED: {
            /**
             * see available values for field `resultBasedScope` in
             * web/src/pages/Notification/NotificationFormPage/Forms/notificationTypeSection.js
             */
            const { resultBasedScope = 'any' } = JSON.parse(condition.filterCondition)
            if (isResultUpdated) {
              return ['any', 'updated'].includes(resultBasedScope)
            }
            return ['any', 'created'].includes(resultBasedScope)
          }
          case CATEGORY.REPORT_BASED: {
            /**
             * proceed only if action requested particular this instance of NotificationType entry
             */
            return condition.notificationTypeId === action.notificationTypeId
          }
          default:
            // don't allow unknown category
            return false
        }
      }),
      async ({ filterCondition, notificationTypeCategoryExternalId, notificationTypeId, reportId }) => {
        let props = {
          filterCondition: JSON.parse(filterCondition),
          notificationTypeCategoryExternalId,
          notificationTypeId,
        }
        if (category === CATEGORY.ISSUE_BASED) {
          props = { ...props, issueId }
        } else if (category === CATEGORY.RESULT_BASED) {
          props = { ...props, resultId, isResultUpdated }
        } else if (category === CATEGORY.REPORT_BASED) {
          props = { ...props, reportId }
        }

        await createNotifications(knex, props, context)
      }
    )
  })
}

async function onIssueEscalated({ issueId }, { messageContext: context }) {
  return context.transact(async knex =>
    createNotifications(
      knex,
      {
        issueId,
        notificationTypeCategoryExternalId: 'issueBased',
      },
      context
    )
  )
}

module.exports = {
  issueBased,
  resultBased,
  reportBased,
  getNotificationHandler,
  onIssueEscalated,
}
