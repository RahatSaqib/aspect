const { baseGxAlertMigration, upsertDashboardWidgets } = require('../../common')
const geographyFromGxAlert = require('./fixtures/geography.json')
const jobFunctions = require('./fixtures/jobFunctions')

module.exports = async function (
  knex,
  contactsFromGxAlert,
  customFieldsFromGxAlert,
  sitesFromGxAlert,
  adminUserName,
  adminPassword,
  partnerName,
  gxAlertDeviceApiKey
) {
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
    { fixtures: { jobFunctions } }
  )

  const { id: partnerId } = await knex('Partner')
    .where({ name: partnerName })
    .first('id')

  await upsertDashboardWidgets(knex, partnerId)
}
