module.exports = require('../utils').seed(seed, __filename)
const Promise = require('bluebird')
const _ = require('lodash')

const dashboardWidget = require('./fixtures/dashboardWidget.json')
const { getFeatureByModule } = require('../utils')

async function seed(knex) {
  const { id: partnerId } = await knex('Partner')
    .where({ name: 'Nigeria' })
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

  const jobFunctionsSetups = jobFunctions.map(async jf => {
    const { id: featureId } = await getFeatureByModule(knex, 'summaryDashboard')
    await knex('JobFunctionFeature').insert({
      jobFunctionId: jf.id,
      featureId,
    })
    await knex('JobFunctionDashboardWidget').insert([
      { jobFunctionId: jf.id, widgetId: widgetIds.sites },
      { jobFunctionId: jf.id, widgetId: widgetIds.devices },
      { jobFunctionId: jf.id, widgetId: widgetIds.results },
      { jobFunctionId: jf.id, widgetId: widgetIds.contacts },
    ])
  })

  await Promise.all(jobFunctionsSetups)
}
