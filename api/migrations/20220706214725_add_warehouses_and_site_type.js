const tableName = 'SiteType'

module.exports.up = async function (knex) {
  await knex.schema.createTable(tableName, siteType => {
    siteType.increments('id').primary()
    siteType.string('name').notNullable()
    siteType.string('i18nKey').notNullable()
    siteType.string('externalId').notNullable()
  })

  const sabSiteTypeFixedId = 1

  await knex.schema.alterTable('Site', site => {
    site
      .integer('siteTypeId')
      .unsigned()
      .index()
      .defaultTo(sabSiteTypeFixedId)
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
  await knex.schema.dropTable(tableName)
  await knex.schema.alterTable('Site', site => {
    site.dropColumn('siteTypeId')
    site.dropColumn('parentWarehouseId')
  })
}
