exports.up = async function (knex) {
  await knex.schema.alterTable('Partner', tbl => {
    tbl.integer('dueDaysCalibrationIssue').unsigned().nullable()
  })
}

exports.down = async function (knex) {
  await knex.schema.alterTable('Partner', tbl => {
    tbl.dropColumn('dueDaysCalibrationIssue')
  })
}
