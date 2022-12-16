exports.up = async function (knex) {
  await knex.schema.alterTable('ResultFollowUp', followUp => {
    followUp.boolean('isDeleted').notNullable().defaultTo(false)
  })

  await knex.schema.alterTable('ResultFollowUp', followUp => {
    followUp.dropUnique(['resultId', 'externalId'])
  })
}

exports.down = async function (knex) {
  await knex.schema.table('ResultFollowUp', followUp => {
    followUp.dropColumn('isDeleted')
  })

  await knex.schema.alterTable('ResultFollowUp', followUp => {
    followUp.unique(['resultId', 'externalId'])
  })
}
