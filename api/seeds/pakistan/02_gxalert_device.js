module.exports = require('../utils').seed(seed, __filename)

const contactsFromGxAlert = require('./fixtures/contactsFromGxAlert.json')
const customFieldsFromGxAlert = require('./fixtures/customFieldsFromGxAlert.json')
const geographyFromGxAlert = require('./fixtures/geography.json')
const sitesFromGxAlert = require('./fixtures/sitesFromGxAlert.json')
const partnerData = require('./fixtures/partnerData')
const dashboardWidget = require('./fixtures/dashboardWidget')
const { baseGxAlertMigration, upsertDashboardWidgets } = require('../common')

const { partner, serverUrl, adminPassword, deviceApiToken, adminUserName } = partnerData

async function seed(knex) {
  await baseGxAlertMigration(
    {
      admin: {
        name: adminUserName,
        password: adminPassword,
      },
      partner: {
        name: partner.name,
        externalId: partner.externalId,
        serverUrl,
      },
      geographyFromGxAlert,
      gxAlertDevice: {
        deviceApiKeyToken: deviceApiToken,
      },
      sitesFromGxAlert,
      contactsFromGxAlert,
      customFieldsFromGxAlert,
    },
    knex,
    partnerData
  )

  const { id: partnerId } = await knex('Partner').where({ externalId: partner.externalId }).first('id')

  await upsertDashboardWidgets(knex, partnerId, dashboardWidget)
}
