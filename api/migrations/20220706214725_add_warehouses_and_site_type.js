const siteTypes = require('./staticFixtures/SiteType.json')

const siteTypeTableName = 'SiteType'

module.exports.up = async function (knex) {
  await knex.schema.createTable(siteTypeTableName, siteType => {
    siteType.increments('id').primary()
    siteType.string('name').notNullable()
    siteType.string('i18nKey').notNullable()
    siteType.string('externalId').notNullable()
  })

  await knex(siteTypeTableName).insert(siteTypes.data)

  const labSiteTypeFixedId = siteTypes.data.find(
    st => st.externalId === 'lab'
  ).id

  await knex.schema.alterTable('Site', site => {
    site
      .integer('siteTypeId')
      .unsigned()
      .notNullable()
      .index()
      .defaultTo(labSiteTypeFixedId)
      .references('id')
      .inTable('SiteType')

    site
      .integer('parentWarehouseId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Site')
  })
}

module.exports.down = async function (knex) {
  await knex.schema.dropTable(siteTypeTableName)
  await knex.schema.alterTable('Site', site => {
    site.dropColumn('siteTypeId')
    site.dropColumn('parentWarehouseId')
  })
}
