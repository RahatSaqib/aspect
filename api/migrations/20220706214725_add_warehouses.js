const tableName = 'SiteType'

module.exports.up = async function (knex) {
  await knex.schema.createTable(tableName, siteType => {
    siteType.increments('id').primary()
    siteType.string('name').notNullable()
    siteType.string('i18nKey').notNullable()
    siteType.string('externalId').notNullable()
  })

  await knex.schema.alterTable('Site', device => {
    device
      .integer('siteTypeId')
      .unsigned()
      .index()
      .references('id')
      .inTable('SiteType')

    device
      .integer('parentWarehouseId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Site')
  })
}

module.exports.down = async function (knex) {
  await knex.schema.dropTable(tableName)
  await knex.schema.alterTable('Device', device => {
    device.dropColumn('siteTypeId')
    device.dropColumn('parentWarehouseId')
  })
}
