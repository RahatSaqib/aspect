module.exports = require('../utils').seed(seed)

const { updateDashboardWidgetQueries } = require('../utils')

async function seed(knex) {
  const widget = await knex('DashboardWidget')
    .where('title', 'children')
    .first('id')

  if (widget == null) {
    return
  }
  await removeChildrenDashboardTarget(knex)
  await updateDashboardWidgetQueries(knex)
  await turnOffEmailSms(knex)
}

async function removeChildrenDashboardTarget(knex) {
  const { id: childrenWidgetId } = await knex('DashboardWidget')
    .where('title', 'Children')
    .first('id')

  await knex('JobFunctionDashboardWidget')
    .where('widgetId', childrenWidgetId)
    .delete()

  await knex('DashboardWidgetTarget')
    .where('targetToken', 'Children')
    .delete()

  await knex('DashboardWidget')
    .where('id', childrenWidgetId)
    .delete()

  await knex('Target')
    .where('targetToken', 'Children')
    .delete()
}

async function turnOffEmailSms(knex) {
  // turn off email/sms
  await knex('MessageType').update({
    emailTemplateId: null,
    smsTemplateId: null,
  })
}
