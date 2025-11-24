/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.dropTableIfExists('FactDeviceExternalSource')
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.createTable('FactDeviceExternalSource', factDeviceExternalSource => {
    factDeviceExternalSource
      .integer('deviceId')
      .unsigned()
      .references('id')
      .inTable('Device')
      .notNullable()
      .onDelete('CASCADE')
    factDeviceExternalSource.string('sourceName', 50).notNullable()
    factDeviceExternalSource.text('data')
    factDeviceExternalSource.dateTime('updatedOn').notNullable()
    factDeviceExternalSource.unique(['deviceId', 'sourceName'], 'factdeviceexternalsource_unique')
  })
}
