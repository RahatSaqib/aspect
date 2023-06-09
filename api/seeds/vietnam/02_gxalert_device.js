module.exports = require('../utils').seed(seed, __filename)

const jobFunctionsFixture = require('./fixtures/jobFunctions')
const contactsFromGxAlert = require('./fixtures/contactsFromGxAlert.json')
const customFieldsFromGxAlert = require('./fixtures/customFieldsFromGxAlert.json')
const geography = require('./fixtures/geography.json')
const sitesFromGxAlert = require('./fixtures/sitesFromGxAlert.json')
const { adminUserName, partner, serverUrl, deviceApiToken } = require('./fixtures/partnerData')

const { baseGxAlertMigration, upsertDashboardWidgets } = require('../common')
const partnerData = require('./fixtures/partnerData')

async function seed(knex) {
  await baseGxAlertMigration(
    {
      admin: {
        name: adminUserName,
      },
      partner: {
        name: partner.name,
        externalId: partner.externalId,
        serverUrl,
      },
      geographyFromGxAlert: geography,
      gxAlertDevice: {
        deviceApiKeyToken: deviceApiToken,
      },
      sitesFromGxAlert,
      jobFunctionsFixture,
      contactsFromGxAlert,
      customFieldsFromGxAlert,
    },
    knex,
    partnerData
  )

  const { id: partnerId } = await knex('Partner').where({ externalId: partnerData.partner.externalId }).first('id')

  await upsertDashboardWidgets(knex, partnerId)
}
