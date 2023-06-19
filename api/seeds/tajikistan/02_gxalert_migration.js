module.exports = require('../utils').seed(seed, __filename)

const {
  deviceApiToken,
  adminUserName,
  partner: { externalId: partnerExternalId, name: partnerName },
  serverUrl,
} = require('./fixtures/partnerData')
const jobFunctionsFixture = require('../fixtures/jobFunctions')
const contactsFromGxAlert = require('./fixtures/contactsFromGxAlert.json')
const geographyFromGxAlert = require('./fixtures/geography.json')
const sitesFromGxAlert = require('./fixtures/sitesFromGxAlert.json')

const { baseGxAlertMigration, upsertDashboardWidgets } = require('../common')
const partnerData = require('./fixtures/partnerData')

async function seed(knex) {
  await baseGxAlertMigration(
    {
      admin: {
        name: adminUserName,
      },
      partner: {
        externalId: partnerExternalId,
        name: partnerName,
        serverUrl,
      },
      geographyFromGxAlert,
      gxAlertDevice: {
        deviceApiKeyToken: deviceApiToken,
      },
      sitesFromGxAlert,
      jobFunctionsFixture,
      contactsFromGxAlert,
    },
    knex,
    partnerData
  )

  const { id: partnerId } = await knex('Partner').where({ externalId: partnerExternalId }).first('id')

  await upsertDashboardWidgets(knex, partnerId)
}
