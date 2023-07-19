module.exports = require('../utils').seed(async knex => {
  const widget = await knex('DashboardWidget').where('externalId', 'personTitle').first()
  if (widget) {
    await knex('DashboardWidgetStat').where({ dashboardWidgetId: widget.id }).del()
    await knex('JobFunctionDashboardWidget').where({ widgetId: widget.id }).del()
    await knex('DashboardWidget').where('id', widget.id).del()
  }
}, __filename)

//
