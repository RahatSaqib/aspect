const Promise = require('bluebird')
module.exports = require('../utils').seed(seed, __filename)

async function seed(knex) {
  const statWidgets = await knex('DashboardWidget')
    .whereIn('titleI18nKey', [
      'dashboardWidgetTitleConfirmedCases',
      'dashboardWidgetTitleTotalActiveCases',
      'dashboardWidgetTitleTotalRecoveredCases',
      'dashboardWidgetTitleTotalDeaths',
    ])
    .select('id as widgetId')
  const { partnerId } = await knex('Partner')
    .where({
      name: 'Wakanda',
    })
    .first('id as partnerId')
  const { id: jobFunctionIdAdmin } = await knex('JobFunction')
    .where('name', 'Admin')
    .where({ partnerId })
    .first('id')
  await Promise.each(statWidgets, async elem => {
    await knex('JobFunctionDashboardWidget').insert([
      { jobFunctionId: jobFunctionIdAdmin, widgetId: elem.widgetId },
    ])
  })
}
