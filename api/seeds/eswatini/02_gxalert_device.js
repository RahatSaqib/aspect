module.exports = require('../utils').seed(seed, __filename)

const jobFunctionsFixture = require('./fixtures/jobFunctions')
const contactsFromGxAlert = require('./fixtures/contactsFromGxAlert.json')
const geographyFromGxAlert = require('./fixtures/geography.json')
const sitesFromGxAlert = require('./fixtures/sitesFromGxAlert.json')

const { baseGxAlertMigration, upsertDashboardWidgets } = require('../common')
const dashboardWidgets = require('./fixtures/dashboardWidget')
const partnerData = require('./fixtures/partnerData')

async function seed(knex) {
  await baseGxAlertMigration(
    {
      admin: {
        name: partnerData.adminUserName,
        password: partnerData.adminPassword,
      },
      partner: {
        name: partnerData.partnerName,
        serverUrl: partnerData.serverUrl,
      },
      geographyFromGxAlert,
      gxAlertDevice: {
        deviceApiKeyToken: partnerData.deviceApiToken,
      },
      sitesFromGxAlert,
      jobFunctionsFixture,
      contactsFromGxAlert,
      customFieldsFromGxAlert: [],
    },
    knex,
    partnerData
  )

  const { id: partnerId } = await knex('Partner')
    .where({ name: partnerData.partnerName })
    .first('id')

  await upsertDashboardWidgets(knex, partnerId, dashboardWidgets)
}
