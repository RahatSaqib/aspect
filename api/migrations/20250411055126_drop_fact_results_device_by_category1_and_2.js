module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.dropTableIfExists('FactResultsDeviceByCategory1And2')
}

async function down(knex) {
  await knex.schema.createTable('FactResultsDeviceByCategory1And2', x => {
    x.integer('deviceId').unsigned().references('id').inTable('Device').notNullable().onDelete('CASCADE')
    x.integer('days').unsigned().notNullable()
    x.integer('assayId').unsigned().references('id').inTable('Assay').notNullable().onDelete('CASCADE')
    x.integer('resultCategory1')
      .unsigned()
      .index()
      .references('id')
      .inTable('ResultCategory')
      .notNullable()
      .onDelete('CASCADE')
    x.integer('resultCategory2')
      .unsigned()
      .index()
      .references('id')
      .inTable('ResultCategory')
      .notNullable()
      .onDelete('CASCADE')
    x.integer('resultCount').unsigned().notNullable()
    x.specificType('calculatedOn', 'DATETIME(3)').notNullable()
    x.unique(
      ['deviceId', 'assayId', 'resultCategory1', 'resultCategory2', 'days'],
      'factresultsdevicebycategory1and2_unique'
    )
  })
}
