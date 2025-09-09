module.exports.up = async function up(knex) {
  await knex.schema.createTable('MobileDevice', function (table) {
    table.increments('id').primary()
    table.string('deviceIdentifier', 3).notNullable().unique().index()
    table.string('deviceCode', 100).nullable().index()
    table.boolean('active').defaultTo(false).notNullable().index()
    table.integer('createdBy').nullable().unsigned().index().references('id').inTable('User')
    table.dateTime('createdOn').nullable()
    table.integer('updatedBy').nullable().unsigned().index().references('id').inTable('User')
    table.dateTime('updatedOn').nullable()
  })

  await knex.schema.alterTable('Sample', function (table) {
    table.string('source', 35).nullable()
  })
}

module.exports.down = async function down(knex) {
  await knex.schema.dropTable('MobileDevice')
}
