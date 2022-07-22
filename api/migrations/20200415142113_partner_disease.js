module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.createTable('PartnerDisease', x => {
    x.integer('partnerId').unsigned().index().references('id').inTable('Partner')
    x.integer('diseaseId').unsigned().index().references('id').inTable('Disease')
    x.boolean('canAutoAssignResultByCaseId').notNullable().defaultTo(0)

    x.unique(['partnerId', 'diseaseId'], 'unique_partner_disease')
  })
}

async function down(knex) {
  await knex.schema.dropTable('PartnerDisease')
}
