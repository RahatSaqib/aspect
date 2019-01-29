module.exports = require('../src/db').migration(up, down)

const Promise = require('bluebird')

async function up(knex) {
  await knex.schema.table('Person', person => {
    person.dropForeign(['createdBy'])
    person.dropForeign(['updatedBy'])
  })
  await knex.schema.table('Person', person => {
    person
      .integer('createdBy')
      .unsigned()
      .references('id')
      .inTable('User')
      .nullable()
      .alter()
    person
      .integer('updatedBy')
      .unsigned()
      .references('id')
      .inTable('User')
      .onDelete('SET NULL')
      .nullable()
      .alter()
  })

  await knex.schema.table('NotificationType', notificationType => {
    notificationType.dropForeign(['createdBy'])
    notificationType.dropForeign(['updatedBy'])
  })
  await knex.schema.table('NotificationType', notificationType => {
    notificationType
      .integer('createdBy')
      .unsigned()
      .references('id')
      .inTable('User')
      .nullable()
      .alter()
    notificationType
      .integer('updatedBy')
      .unsigned()
      .references('id')
      .inTable('User')
      .onDelete('SET NULL')
      .nullable()
      .alter()
  })
}

async function down(knex) {
  const firstCountryAdminUserPerPartner = await knex('JobFunction as jf')
    .join('Job as j', 'jf.id', 'j.jobFunctionId')
    .join('Person as p', 'j.personId', 'p.id')
    .join('JobContext as jc', 'j.id', 'jc.jobId')
    .join('Geography as g', 'jc.geographyId', 'g.id')
    .where('jf.name', 'Admin')
    .whereNull('g.stateId')
    .whereNull('g.lgaId')
    .whereNotNull('g.countryId')
    .whereNotNull('p.userId')
    .whereNotNull('p.lastPartnerId')
    .groupBy('jf.name', 'jf.partnerId')
    .select('p.userId', 'jf.partnerId')

  await knex.schema.table('Person', person => {
    person.dropForeign(['createdBy'])
    person.dropForeign(['updatedBy'])
  })
  await knex('Person')
    .whereNull('lastPartnerId')
    .update({
      createdBy: firstCountryAdminUserPerPartner[0].userId,
      updatedBy: firstCountryAdminUserPerPartner[0].userId,
    })
  await Promise.each(firstCountryAdminUserPerPartner, async countryAdmin =>
    knex('Person')
      .where('lastPartnerId', countryAdmin.partnerId)
      .update({
        createdBy: countryAdmin.userId,
        updatedBy: countryAdmin.userId,
      })
  )

  await knex.schema.table('Person', person => {
    person
      .integer('createdBy')
      .unsigned()
      .references('id')
      .inTable('User')
      .notNullable()
      .alter()
    person
      .integer('updatedBy')
      .unsigned()
      .references('id')
      .inTable('User')
      .notNullable()
      .alter()
  })

  await knex.schema.table('NotificationType', notificationType => {
    notificationType.dropForeign(['createdBy'])
    notificationType.dropForeign(['updatedBy'])
  })
  await Promise.each(firstCountryAdminUserPerPartner, async countryAdmin =>
    knex('NotificationType')
      .where('partnerId', countryAdmin.partnerId)
      .update({
        createdBy: countryAdmin.userId,
        updatedBy: countryAdmin.userId,
      })
  )

  await knex.schema.table('NotificationType', notificationType => {
    notificationType
      .integer('createdBy')
      .unsigned()
      .references('id')
      .inTable('User')
      .notNullable()
      .alter()
    notificationType
      .integer('updatedBy')
      .unsigned()
      .references('id')
      .inTable('User')
      .notNullable()
      .alter()
  })
}
