const { createAuditTriggers } = require('./utils/createAuditTriggers')

module.exports.up = async function up(knex) {
  await knex.schema.createTable('MobileDevice', function (table) {
    table.increments('id').primary()
    table.string('deviceAppSpot', 3).notNullable().unique().index()
    table.string('deviceCode', 100).nullable().index()
    table.boolean('active').defaultTo(false).notNullable().index()
    table.integer('createdBy').nullable().unsigned().index().references('id').inTable('User')
    table.dateTime('createdOn').nullable()
    table.integer('updatedBy').nullable().unsigned().index().references('id').inTable('User')
    table.dateTime('updatedOn').nullable()
  })

  await knex.schema.createTable('z_MobileDevice', function (table) {
    table.integer('id').nullable()
    table.string('deviceAppSpot', 3).nullable()
    table.string('deviceCode', 100).nullable()
    table.boolean('active').nullable()
    table.integer('createdBy').nullable()
    table.dateTime('createdOn').nullable()
    table.integer('updatedBy').nullable()
    table.dateTime('updatedOn').nullable()
    table.dateTime('timestamp').nullable().defaultTo(knex.fn.now())
  })

  await createAuditTriggers(knex, 'MobileDevice', 'z_MobileDevice')

  await knex.schema.alterTable('Sample', function (table) {
    table.string('source', 35).nullable()
  })

  await knex.schema.createTable('z_Sample', function (table) {
    table.integer('id').nullable()
    table.string('externalId', 255).nullable()
    table.dateTime('collectedOn').nullable()
    table.integer('sampleTypeId').unsigned().nullable()
    table.integer('originSiteId').unsigned().nullable()
    table.integer('patientId').unsigned().nullable()
    table.json('sampleData').nullable()
    table.string('sampleStatus', 255).nullable()
    table.integer('updatedBy').unsigned().nullable()
    table.string('source', 100).nullable()
    table.dateTime('updatedOn').nullable()
    table.integer('collectedBy').unsigned().nullable()
    table.boolean('registeredInAspect').nullable()
    table.dateTime('createdOn').nullable()
    table.integer('createdBy').unsigned().nullable()
    table.dateTime('timestamp').nullable().defaultTo(knex.fn.now())
  })

  await createAuditTriggers(knex, 'Sample', 'z_Sample')
}

module.exports.down = async function down(knex) {
  await knex.schema.dropTable('z_Sample')
  await knex.schema.dropTable('MobileDevice')
}
