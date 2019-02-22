module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.createTable('License', license => {
    license.increments('id')
    license
      .integer('partnerId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Partner')
    license.dateTime('createdOn').notNullable()
    license.text('content').notNullable()
    license.charset('utf8')
  })

  await knex.schema.createTable('LicenseUser', licenseUser => {
    licenseUser
      .integer('licenseId')
      .unsigned()
      .index()
      .notNullable()
      .references('id')
      .inTable('License')
    licenseUser
      .integer('userId')
      .unsigned()
      .index()
      .notNullable()
      .references('id')
      .inTable('User')
    licenseUser.dateTime('acceptedOn').notNullable()
    licenseUser.string('ip', 100).notNullable()
    licenseUser.string('client', 500).notNullable()
    licenseUser.primary(['licenseId', 'userId'])
    licenseUser.charset('utf8')
  })

  await knex.schema.table('Person', person => {
    person.dropColumns('acceptedLicenseOn')
  })
}

async function down(knex) {
  await knex.schema.table('Person', person => {
    person.dateTime('acceptedLicenseOn')
  })

  await knex.schema.dropTable('LicenseUser')
  await knex.schema.dropTable('License')
}
