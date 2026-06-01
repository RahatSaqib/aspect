module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex('Device as d')
    .join('DeviceApiKey as dak', 'dak.deviceId', 'd.id')
    .join('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
    .whereNot('dt.externalId', 'CepheidGeneXpert')
    .update('d.deviceApiKeyId', knex.raw('dak.id'))

  await knex.schema.alterTable('DeviceApiKey', table => {
    table.dropForeign('deviceId')
    table.dropColumn('deviceId')
  })
}

async function down(knex) {
  await knex.schema.alterTable('DeviceApiKey', table => {
    table.integer('deviceId').unsigned().index().references('id').inTable('Device')
  })

  await knex('DeviceApiKey as dak')
    .join('Device as d', 'd.deviceApiKeyId', 'dak.id')
    .join('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
    .whereNot('dt.externalId', 'CepheidGeneXpert')
    .update('dak.deviceId', knex.raw('d.id'))

  await knex('Device as d')
    .join('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
    .whereNot('dt.externalId', 'CepheidGeneXpert')
    .update('d.deviceApiKeyId', null)
}
