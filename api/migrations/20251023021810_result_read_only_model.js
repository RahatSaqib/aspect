const { recreateResultReadTable, createResultReadTriggers } = require('./utils/recreateResultReadTable')

exports.up = async function (knex) {
  await recreateResultReadTable(knex)
  // Create triggers that will handle inserts/updates going forward
  await createResultReadTriggers(knex)
}

// order by r.id;
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('Result_read')
}
