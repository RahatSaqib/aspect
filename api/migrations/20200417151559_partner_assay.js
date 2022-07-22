module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.createTable('PartnerAssay', x => {
    x.integer('partnerId').unsigned().index().references('id').inTable('Partner')
    x.integer('assayId').unsigned().index().references('id').inTable('Assay')

    x.boolean('canCreate').notNullable().defaultTo(0)
    x.boolean('canDelete').notNullable().defaultTo(0)
    x.boolean('canEdit').notNullable().defaultTo(0)

    x.unique(['partnerId', 'assayId'], 'unique_partner_assay')
  })
}

async function down(knex) {
  await knex.schema.dropTable('PartnerAssay')
}
