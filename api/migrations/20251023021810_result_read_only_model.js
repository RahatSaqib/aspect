const { recreateResultReadTable } = require('./utils/recreateResultReadTable')

exports.up = async function (knex) {
  await recreateResultReadTable(knex)
}

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('Result_READ')
}
