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

  // Create z_Sample table with all fields nullable, no constraints, plus timestamp
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

  await knex.raw(`
    CREATE TRIGGER trg_z_Sample_update
    AFTER UPDATE ON Sample
    FOR EACH ROW
    INSERT INTO z_Sample (
      id,
      externalId,
      collectedOn,
      sampleTypeId,
      originSiteId,
      patientId,
      sampleData,
      sampleStatus,
      updatedBy,
      source,
      updatedOn,
      collectedBy,
      registeredInAspect,
      createdOn,
      createdBy,
      timestamp
    ) VALUES (
      OLD.id,
      OLD.externalId,
      OLD.collectedOn,
      OLD.sampleTypeId,
      OLD.originSiteId,
      OLD.patientId,
      OLD.sampleData,
      OLD.sampleStatus,
      OLD.updatedBy,
      OLD.source,
      OLD.updatedOn,
      OLD.collectedBy,
      OLD.registeredInAspect,
      OLD.createdOn,
      OLD.createdBy,
      NOW()
    );
  `)
}

module.exports.down = async function down(knex) {
  await knex.schema.dropTable('MobileDevice')
}
