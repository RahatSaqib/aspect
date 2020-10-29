module.exports = require('../utils').seed(seed, __filename)

const _ = require('lodash')

const jobFunctions = require('./fixtures/jobFunctions.json')
const contactsFromGxAlert = require('./fixtures/contactsFromGxAlert.json')
const customFieldsFromGxAlert = require('./fixtures/customFieldsFromGxAlert.json')
const geographyFromGxAlert = require('./fixtures/geography.json')
const sitesFromGxAlert = require('./fixtures/sitesFromGxAlert.json')
const labClinic = require('./fixtures/labClinic.json')
const partnerData = require('./fixtures/partnerData.json')
const dashboardWidget = require('./fixtures/dashboardWidget')
const {
  baseGxAlertMigration,
  seedLabClinicFixture,
  upsertDashboardWidgets,
} = require('../common')

const {
  partnerName,
  serverUrl,
  adminPassword,
  deviceApiToken,
  adminUserName,
} = partnerData

async function seed(knex) {
  const migrationSeededData = await baseGxAlertMigration(
    {
      admin: {
        name: adminUserName,
        password: adminPassword,
      },
      partner: {
        name: partnerName,
        serverUrl,
      },
      geographyFromGxAlert,
      gxAlertDevice: {
        deviceApiKeyToken: deviceApiToken,
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
    .where({ name: partnerName })
    .first('id')

  await upsertDashboardWidgets(knex, partnerId, dashboardWidget)
}
