module.exports = require('../utils').seed(seed, __filename)

async function seed(knex) {
  const errorCategory = await knex('ResultCategory').where({ externalId: 'Error' }).first('id')
  const errorCategoryId = errorCategory && errorCategory.id

  if (!errorCategoryId) {
    return
  }

  const widgetExternalIds = ['errorRate', 'errorRateHome']
  const widgets = await knex('DashboardWidget').whereIn('externalId', widgetExternalIds).select('id', 'linkParams')

  const updates = widgets.map(widget => {
    let linkParams

    try {
      linkParams = widget.linkParams ? JSON.parse(widget.linkParams) : {}
    } catch (error) {
      linkParams = {}
    }

    // ResultWorkflow was removed in v1.72.0; use result category filter for errors instead.
    delete linkParams.workflowStatusId
    linkParams.resultCategoryId = errorCategoryId

    return knex('DashboardWidget')
      .where({ id: widget.id })
      .update({
        linkParams: JSON.stringify(linkParams),
      })
  })

  await Promise.all(updates)
}
