const { addCreateFields, addUpdateFields } = require('./utils')

exports.up = async function (knex) {
  await knex.schema.dropTableIfExists('DeviceSim')
}

exports.down = async function (knex) {
  await knex.schema.createTable('DeviceSim', sim => {
    sim.increments('id')
    sim.integer('deviceId').unsigned().notNullable().index().references('id').inTable('Device')
    sim.string('provider')
    sim.string('serial')
    sim.string('number')
    addCreateFields(sim)
    addUpdateFields(sim)
  })
}
