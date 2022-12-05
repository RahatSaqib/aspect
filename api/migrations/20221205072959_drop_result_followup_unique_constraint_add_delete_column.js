exports.up = async function (knex) {
  await knex.schema.alterTable('ResultFollowUp', followUp => {
    followUp.boolean('isDeleted').notNullable().defaultTo(false)
  })
}

exports.down = async function (knex) {
  await knex.schema.table('ResultFollowUp', followUp => {
    followUp.dropIndex(['resultId', 'externalId'], 'unique')
  })
}
