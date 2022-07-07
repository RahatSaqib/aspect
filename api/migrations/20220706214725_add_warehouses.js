const { addAuditFields } = require('./utils')

const tableName = 'SiteType'

module.exports.up = async function (knex) {
  await knex.schema.createTable(tableName, locationType => {
    locationType.increments('id').primary()
    locationType.string('name').notNullable()
    locationType.string('externalId').notNullable()
    addAuditFields(locationType)
  })

  await knex.schema.alterTable('Site', device => {
    device
      .integer('siteTypeId')
      .unsigned()
      .index()
      .references('id')
      .inTable('SiteType')

    device
      .integer('assignedWarehouseId')
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
    device.dropColumn('assignedWarehouseId')
  })
}
