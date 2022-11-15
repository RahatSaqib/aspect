const Promise = require('bluebird')
const { alertMessageSent } = require('./actions')
const { messageStatusToId, issueTypeToId } = require('../shared/dictionary')
const { addDataSourceToQuery, processUsingDataSourceQuery } = require('../stringTemplate/service')
const { getConstraints } = require('../auth/constraints')

async function onAlertMessageCreated({ alertMessageId }, { messageContext }) {
  const context = messageContext.bindActionCreators({ alertMessageSent })

  return context.transact(async knex => {
    const message = await createAlertMessageFromTemplate(knex, alertMessageId)
    const messageStatusId = await messageStatusToId('Sent')

    await knex('AlertMessage').where({ id: alertMessageId }).update({
      message,
      messageStatusId,
      updatedOn: new Date(),
    })

    context.alertMessageSent(alertMessageId)
  })
}

async function onAlertMessageUpdateAfterIssueDataChanged({ issueId }, { messageContext }) {
  return messageContext.transact(async knex => {
    const { issueTypeId } = (await knex('Issue').where('id', issueId).first('issueTypeId')) || {}

    // if issueType does not need to update alert message - exit
    // (later add here condition for DataCategoryLow* issue types which should update percentage in alert message)
    const issueTypeIdStockout = await issueTypeToId('InventoryStockout')
    if (issueTypeId !== issueTypeIdStockout) {
      return
    }

    const messageStatusId = await messageStatusToId('Sent')

    const items = await knex('Notification as n')
      .innerJoin('NotificationType as nt', 'n.notificationTypeId', 'nt.id')
      .where('nt.issueTypeId', issueTypeId)
      .where('n.issueId', issueId)
      .select('n.alertMessageId')
    await Promise.each(items, async ({ alertMessageId }) => {
      // generate actual message
      const message = await createAlertMessageFromTemplate(knex, alertMessageId)
      // update
      await knex('AlertMessage')
        .where({ id: alertMessageId, messageStatusId }) // update only for Sent message status
        .whereNot('message', message) // update only if message text changed
        .update({
          message,
          updatedOn: new Date(),
        })
    })
  })
}

// --------------------------------------
// helper functions
// --------------------------------------
async function createAlertMessageFromTemplate(knex, alertMessageId) {
  const { personId, resultId, reportId } =
    (await knex('AlertMessage as a')
      .join('Notification as n', 'n.alertMessageId', 'a.id')
      .where('a.id', alertMessageId)
      .first('n.personId', 'n.resultId', 'n.reportId')) || {}
  const dataConstraints = await getConstraints({ personId })
  const data = await knex('AlertMessage as m')
    .innerJoin('AlertTemplate as tmpl', 'm.alertTemplateId', 'tmpl.id')
    .leftJoin('Notification as n', 'n.alertMessageId', 'm.id')
    .modify(addDataSourceToQuery, { message: 'm', notification: 'n' }, dataConstraints, resultId, reportId)
    .where({ 'm.id': alertMessageId })
    .first('tmpl.message as messageTemplate')
  const { message } = await processUsingDataSourceQuery(data, ['messageTemplate'], {
    dynamic: true,
  })
  return message
}

module.exports = {
  onAlertMessageCreated,
  onAlertMessageUpdateAfterIssueDataChanged,
}
