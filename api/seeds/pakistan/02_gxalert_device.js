module.exports = require('../utils').seed(seed, __filename)

const _ = require('lodash')

const jobFunctions = require('./fixtures/jobFunctions.json')
const contactsFromGxAlert = require('./fixtures/contactsFromGxAlert.json')
const customFieldsFromGxAlert = require('./fixtures/customFieldsFromGxAlert.json')
const geographyFromGxAlert = require('./fixtures/geography.json')
const sitesFromGxAlert = require('./fixtures/sitesFromGxAlert.json')
const labClinic = require('./fixtures/labClinic.json')

const {
  baseGxAlertMigration,
  seedLabClinicFixture,
  upsertDashboardWidgets,
} = require('../common')

async function seed(knex) {
  const migrationSeededData = await baseGxAlertMigration(
    {
      admin: {
        name: 'pakistan',
      },
      partner: {
        name: 'Pakistan',
        serverUrl: 'https://pakistan.aspect.id',
      },
      geographyFromGxAlert,
      gxAlertDevice: {
        deviceApiKeyToken: '77zc0ar862xcys2626w6',
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

  const { id: partnerId } = await knex('Partner')
    .where({ name: 'Pakistan' })
    .first('id')

  await upsertDashboardWidgets(knex, partnerId)
}
