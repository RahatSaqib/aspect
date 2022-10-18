module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  // create new fact table to store counts by month
  await knex.schema.createTable('FactResultsDeviceByTimeFrame', x => {
    x.integer('deviceId').unsigned().references('id').inTable('Device').notNullable().onDelete('CASCADE')
    x.string('timeFrame', 45).notNullable()
    x.dateTime('startedOn').notNullable()
    x.integer('assayId').unsigned().references('id').inTable('Assay').notNullable().onDelete('CASCADE')
    x.integer('resultCategory1')
      .unsigned()
      .index()
      .references('id')
      .inTable('ResultCategory')
      .notNullable()
      .onDelete('CASCADE')
    x.integer('resultCategory2').unsigned().index().references('id').inTable('ResultCategory').onDelete('CASCADE')
    x.integer('resultCount').unsigned().notNullable()
    x.specificType('calculatedOn', 'DATETIME(3)').notNullable()
    x.unique(
      ['deviceId', 'assayId', 'resultCategory1', 'resultCategory2', 'timeFrame', 'startedOn'],
      'factresultsdevicebytimeframe_unique'
    )
  })
}

async function down(knex) {
  await knex.schema.dropTableIfExists('FactResultsDeviceByTimeFrame')
}
