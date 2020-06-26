module.exports = require('../src/db').migration(up, down)
const Promise = require('bluebird')

async function up(knex) {
  await knex.schema.table('DashboardWidget', tblWidget => {
    tblWidget.string('description')
    tblWidget.string('descriptionI18nKey')
  })

  const widgets = await knex('DashboardWidget')
  const updateDescriptionFields = widgets.map(widget =>
    knex('DashboardWidget')
      .where(widget)
      .update({
        description: '',
        descriptionI18nKey: widget.titleI18nKey.replace('Title', 'Description'),
      })
  )
  await Promise.all(updateDescriptionFields)

  await knex.schema.alterTable('DashboardWidget', tblWidget => {
    tblWidget.string('description').notNullable().alter()
    tblWidget.string('descriptionI18nKey').notNullable().alter()
  })
}

async function down(knex) {
  await knex.schema.table('DashboardWidget', tblWidget => {
    tblWidget.dropColumn('description')
    tblWidget.dropColumn('descriptionI18nKey')
  })
}
