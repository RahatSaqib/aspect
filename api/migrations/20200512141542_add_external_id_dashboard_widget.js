module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('DashboardWidget', tblDashboardWidget => {
    tblDashboardWidget.string('externalId').nullable()
  })

  const { quantity } = await knex.select('titleI18nKey').from('DashboardWidget').count('* as quantity').first()

  if (quantity > 0) {
    await knex('DashboardWidget')
      .update({
        externalId: knex.raw('??', ['titleI18nKey']),
      })
      .whereNull('externalId')
  }

  await knex.schema.alterTable('DashboardWidget', tblDashboardWidget => {
    tblDashboardWidget.string('externalId').notNullable().unique().alter()
  })
}

async function down(knex) {
  await knex.schema.alterTable('DashboardWidget', tblDashboardWidget => {
    tblDashboardWidget.dropColumn('externalId')
  })
}
