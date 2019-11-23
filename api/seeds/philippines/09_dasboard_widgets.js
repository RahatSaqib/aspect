module.exports = require('../utils').seed(seed, __filename)

const _ = require('lodash')
const Promise = require('bluebird')

const dashboardWidget = require('./fixtures/dashboardWidget.json')

async function seed(knex) {
  const { id: partnerId } = await knex('Partner')
    .where({ name: 'Philippines' })
    .first('id')

  const widgetIds = {}
  await Promise.all(
    _.map(dashboardWidget.stat, async widget => {
      const widgetData = _.pick(widget, [
        'title',
        'titleI18nKey',
        'subTitle',
        'subTitleI18nKey',
        'sqlForIndicator',
        'link',
        'sortOrder',
      ])
      const [widgetId] = await knex('DashboardWidget').insert(widgetData)
      const statWidgetData = _.pick(widget, [
        'icon',
        'sqlForStatUnit',
        'statUnit',
        'statUnitI18nKey',
        'statStatus',
        'statStatusI18nKey',
        'sqlForExtra',
        'extraUnit',
        'extraUnitI18nKey',
        'extraLabel',
        'extraLabelI18nKey',
      ])
      await knex('DashboardWidgetStat').insert(
        Object.assign({ dashboardWidgetId: widgetId }, statWidgetData)
      )
      widgetIds[_.toLower(widget.title)] = widgetId
    })
  )

  const jobFunctions = await knex('JobFunction')
    .where({ partnerId })
    .select('id', 'name')
  await Promise.each(jobFunctions, async jobFunction => {
    await knex('JobFunctionDashboardWidget').insert([
      { jobFunctionId: jobFunction.id, widgetId: widgetIds.sites },
      { jobFunctionId: jobFunction.id, widgetId: widgetIds.devices },
      { jobFunctionId: jobFunction.id, widgetId: widgetIds.results },
      { jobFunctionId: jobFunction.id, widgetId: widgetIds.contacts },
    ])
  })
}
