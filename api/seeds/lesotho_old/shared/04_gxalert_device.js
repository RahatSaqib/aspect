const { baseGxAlertMigration, upsertDashboardWidgets } = require('../../common')
const geographyFromGxAlert = require('./fixtures/geography.json')
const jobFunctions = require('./fixtures/jobFunctions')

module.exports = async function (knex, contactsFromGxAlert, customFieldsFromGxAlert, sitesFromGxAlert, partnerData) {
  const { adminUserName, adminPassword, partner, gxAlertDeviceApiKey } = partnerData
  await baseGxAlertMigration(
    {
      admin: {
        name: adminUserName,
        password: adminPassword,
      },
      partner: {
        name: partner.name,
        externalId: partner.externalId,
        serverUrl: 'https://lesotho.aspect.id',
      },
      geographyFromGxAlert,
      gxAlertDevice: {
        deviceApiKeyToken: gxAlertDeviceApiKey,
      },
      sitesFromGxAlert,
      jobFunctionsFixture: jobFunctions,
      contactsFromGxAlert,
      customFieldsFromGxAlert,
    },
    knex,
    partnerData
  )

  const { id: partnerId } = await knex('Partner').where({ externalId: partner.externalId }).first('id')

  await upsertDashboardWidgets(knex, partnerId)
}
