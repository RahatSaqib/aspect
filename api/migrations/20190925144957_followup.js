module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.createTable('FollowUpType', followUpType => {
    followUpType.increments('id').primary()
    followUpType.string('name').notNullable()
    followUpType.string('externalId').notNullable()
    followUpType.string('i18nKey').notNullable()
  })

  await knex.schema.createTable('FollowUp', followUp => {
    followUp.increments('id').primary()
    followUp.integer('followUpTypeId').unsigned().index().references('id').inTable('FollowUpType').notNullable()
    followUp.string('name').notNullable()
    followUp.string('externalId').notNullable()
    followUp.string('i18nKey').notNullable()
  })

  await knex.schema.createTable('FollowUpAssay', followUpAssay => {
    followUpAssay.integer('partnerId').unsigned().index().references('id').inTable('Partner').notNullable()
    followUpAssay.integer('followUpId').unsigned().index().references('id').inTable('FollowUp').notNullable()
    followUpAssay.integer('assayId').unsigned().index().references('id').inTable('Assay')
    followUpAssay.integer('resultCategory1').unsigned().index().references('id').inTable('ResultCategory')
    followUpAssay.integer('resultCategory2').unsigned().index().references('id').inTable('ResultCategory')
    followUpAssay.unique(
      ['partnerId', 'followUpId', 'assayId', 'resultCategory1', 'resultCategory2'],
      'FollowUpAssay_unique'
    )
  })

  await knex.schema.createTable('ResultFollowUp', followUp => {
    followUp.increments('id')
    followUp.string('externalId')
    followUp.integer('resultId').unsigned().index().references('id').inTable('Result').notNullable()
    followUp.integer('followUpId').unsigned().index().references('id').inTable('FollowUp').notNullable()
    followUp.datetime('date')
    followUp.datetime('createdOn').notNullable().defaultTo(knex.fn.now())
    followUp.integer('createdBy').notNullable().unsigned().index().references('id').inTable('User')
    followUp.datetime('updatedOn').notNullable().defaultTo(knex.fn.now())
    followUp.integer('updatedBy').notNullable().unsigned().index().references('id').inTable('User')
    followUp.unique(['resultId', 'externalId'])
  })
}

async function down(knex) {
  await knex.schema.dropTable('ResultFollowUp')
  await knex.schema.dropTable('FollowUpAssay')
  await knex.schema.dropTable('FollowUp')
  await knex.schema.dropTable('FollowUpType')
}
