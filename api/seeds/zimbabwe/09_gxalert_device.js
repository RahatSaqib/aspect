module.exports = require('../utils').seed(seed, __filename)

const _ = require('lodash')

const jobFunctions = require('./fixtures/jobFunctions.json')
const contactsFromGxAlert = require('./fixtures/contactsFromGxAlert.json')
const customFieldsFromGxAlert = require('./fixtures/customFieldsFromGxAlert.json')
const geographyFromGxAlert = require('./fixtures/geography.json')
const sitesFromGxAlert = require('./fixtures/sitesFromGxAlert.json')
const labClinic = require('./fixtures/labClinic.json')

const { baseGxAlertMigration, seedLabClinicFixture } = require('../common')

async function seed(knex) {
  const migrationSeededData = await baseGxAlertMigration(
    {
      partner: {
        name: 'Zimbabwe',
        serverUrl: 'https://zimbabwe.aspect.id:2843',
      },
      geographyFromGxAlert,
      gxAlertDevice: {
        deviceApiKeyToken: '882ddqbrazv8m5j2buag',
      },
      sitesFromGxAlert,
      jobFunctions,
      contactsFromGxAlert,
      customFieldsFromGxAlert,
    },
    knex
  )

  await seedLabClinicFixture(
    labClinic,
    _.pick(migrationSeededData, [
      'adminId',
      'partnerId',
      'countryId',
      'statesByName',
    ]),
    knex
  )
}
