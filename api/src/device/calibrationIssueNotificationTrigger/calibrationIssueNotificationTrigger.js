const { findOpenIssues } = require('../../issue/common/db')
const { issueNotificationTriggered } = require('../../notification/actions')

async function onCalibrationIssueNotificationTrigger(_, { messageContext: context }) {
  if (!context.issueNotificationTriggered) {
    context.bindActionCreators({
      issueNotificationTriggered,
    })
  }

  return context.run(async knex => {
    // TODO: Group by days notificated, take the min and if it's null or has more days that the current threshold, launch
    const findOpenIssuesModifier = qb => {
      qb.leftJoin('Notification as n', 'n.issueId', 'i.id')
        .leftJoin('NotificationType as nt', 'n.notificationTypeId', 'nt.id')
        .select(knex.raw("nt.filterCondition -> '$.daysBeforeCalibrationDueDate'"), 'i.issueTypeId')
    }
    const openCalibrationIssues = await findOpenIssues(knex, 'CalibrationDueDate', findOpenIssuesModifier)

    openCalibrationIssues.forEach(issue => {
      context.dispatch(issueNotificationTriggered(issue.id, issue.issueTypeId))
    })
  })
}

module.exports = onCalibrationIssueNotificationTrigger
