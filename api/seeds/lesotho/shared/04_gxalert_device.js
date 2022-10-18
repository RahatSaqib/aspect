const { baseGxAlertMigration, upsertDashboardWidgets } = require('../../common')
const geographyFromGxAlert = require('./fixtures/geography.json')
const jobFunctions = require('./fixtures/jobFunctions')

module.exports = async function (knex, contactsFromGxAlert, customFieldsFromGxAlert, sitesFromGxAlert, partnerData) {
  const { adminUserName, adminPassword, partnerName, gxAlertDeviceApiKey } = partnerData
  await baseGxAlertMigration(
    {
      admin: {
        name: adminUserName,
        password: adminPassword,
      },
      partner: {
        name: partnerName,
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

  const { id: partnerId } = await knex('Partner').where({ name: partnerName }).first('id')

  await upsertDashboardWidgets(knex, partnerId)
}
