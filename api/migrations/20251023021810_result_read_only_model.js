const { recreateResultReadTable, createResultReadTriggers } = require('./utils/recreateResultReadTable')

exports.up = async function (knex) {
  await recreateResultReadTable(knex)
}

// order by r.id;
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('Result_read')
}
