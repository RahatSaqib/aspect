const _ = require('lodash')
const dashboardWidgetsBase = require('../fixtures/dashboardWidgetsBase')

module.exports = async knex => {
  /**
   * helper func to update all *I18nKey fields of existing widgets
   */
  const updateI18nKeys = async ({
    externalId,
    descriptionI18nKey = null,
    statUnitI18nKey = null,
    subTitleI18nKey = null,
    titleI18nKey,
  }) => {
    const widget = await knex('DashboardWidget').where({ externalId }).first()
    if (widget) {
      await knex('DashboardWidget').where({ id: widget.id }).update({
        descriptionI18nKey,
        subTitleI18nKey,
        titleI18nKey,
      })
      await knex('DashboardWidgetStat').where({ dashboardWidgetId: widget.id }).update({ statUnitI18nKey })
    }
  }

  /**
   * for all declared base widgets - call func updateI18nKeys
   */
  await Promise.all(_.map(dashboardWidgetsBase.stat, widget => updateI18nKeys(widget)))
}
