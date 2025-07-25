exports.up = function (knex) {
  return knex.schema
    .dropTable('Instrument')
    .then(() =>
      knex.schema.createTable('Instrument', table => {
        table.increments('id').primary()

        table.integer('deviceId').unsigned().notNullable()
        table.integer('currentDeviceId').unsigned().nullable()
        table.foreign('deviceId').references('Device.id')

        table.string('serial').nullable()
        table.tinyint('active').notNullable()
      })
    )
    .then(() => {
      return knex.schema.createTable('Module', table => {
        table.increments('id').primary()

        table.integer('deviceId').unsigned().notNullable()
        table.foreign('deviceId').references('Device.id')

        table.integer('instrumentId').unsigned().notNullable()
        table.foreign('instrumentId').references('Instrument.id')

        table.string('serial', 255).nullable()
        table.string('name', 255).nullable()
        table.date('start').notNullable()
        table.date('end').nullable()
      })
    })
}

exports.down = function (knex) {
  return knex.schema.dropTable('Module').then(() => {
    return knex.schema.table('Instrument', table => {
      // Add back the dropped columns
      table.integer('moduleSerial').nullable()
      table.string('moduleName', 5).nullable()
      // Rename 'serial' back to 'instrumentSerial'
      table.renameColumn('serial', 'instrumentSerial')
    })
  })
}
