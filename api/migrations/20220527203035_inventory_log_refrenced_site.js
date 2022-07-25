const tableName = 'InventoryLog'

module.exports.up = async function (knex) {
  await knex.schema.alterTable(tableName, x => {
    x.integer('referencedSiteId').unsigned().index().references('id').inTable('Site')
  })
}

module.exports.down = async function (knex) {
  await knex.schema.alterTable(tableName, x => {
    x.dropForeign('referencedSiteId')
    x.dropIndex('referencedSiteId')
    x.dropColumn('referencedSiteId')
  })
}
