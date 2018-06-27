module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.table('Partner', x => {
    x.integer('dueDaysInventoryStockout')
    x.integer('dueDaysInventoryStockExpiring')
  })

  await knex.schema.createTable('FactInventoryConsumptionRate', x => {
    x
      .integer('siteId')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('Site')
    x
      .integer('consumableId')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('Consumable')
    x
      .integer('days')
      .unsigned()
      .notNullable()
    // for 'rate' use float - because daily rate is calculated as "totals for last 10 days with at least 1 test"/10
    x.float('rate').notNullable()
    x.dateTime('updatedOn').notNullable()
    x.primary(['siteId', 'consumableId', 'days'])
  })

  await knex.schema.createTable('DataCategory', x => {
    x.increments('id')
    x.string('name').notNullable()
    // field 'fieldNames' holds either string with property name or stringified array of strings
    // with property names in patientData json
    x.string('fieldNames', 1000).notNullable()
    x
      .integer('partnerId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Partner')
      .notNullable()
    x.string('i18nKey')
    x.string('externalId').notNullable()
    // stringified arrays of strings with values
    x.string('validValues', 1000)
    x.string('invalidValues', 1000)
    x.integer('cutoffPercentage').notNullable()
    x.charset('utf8')
  })
}
async function down(knex) {
  await knex.schema.table('Partner', x => {
    x.dropColumns('dueDaysInventoryStockout', 'dueDaysInventoryStockExpiring')
  })

  await knex.schema.dropTableIfExists('FactInventoryConsumptionRate')
  
  await knex.schema.dropTableIfExists('DataCategory')
}
