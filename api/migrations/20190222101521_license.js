module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.createTable('License', license => {
    license.increments('id')
    license.integer('partnerId').unsigned().index().references('id').inTable('Partner')
    license.dateTime('createdOn').notNullable()
    license.mediumtext('content').notNullable()
  })

  await knex.schema.createTable('LicensePerson', licensePerson => {
    licensePerson.integer('licenseId').unsigned().index().notNullable().references('id').inTable('License')
    licensePerson.integer('personId').unsigned().index().notNullable().references('id').inTable('Person')
    licensePerson.dateTime('acceptedOn').notNullable()
    licensePerson.string('ip', 100).notNullable()
    licensePerson.primary(['licenseId', 'personId'])
  })

  await knex.schema.table('Person', person => {
    person.dropColumns('acceptedLicenseOn')
  })
}

async function down(knex) {
  await knex.schema.table('Person', person => {
    person.dateTime('acceptedLicenseOn')
  })

  await knex.schema.dropTable('LicensePerson')
  await knex.schema.dropTable('License')
}
