const updateWidgetI18nKey = require('../../common/20210312_update_widget_i18key')

module.exports = require('../../utils').seed(async knex => updateWidgetI18nKey(knex), __filename)
