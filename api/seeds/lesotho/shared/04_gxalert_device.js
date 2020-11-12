const { baseGxAlertMigration, upsertDashboardWidgets } = require('../../common')
const geographyFromGxAlert = require('./fixtures/geography.json')
const jobFunctions = require('../../common/fixtures/jobFunctions.json')

module.exports = async function (
  knex,
  contactsFromGxAlert,
  customFieldsFromGxAlert,
  sitesFromGxAlert,
  adminName,
  adminPassword,
  partnerName,
  gxAlertDeviceApiKey
) {
  await baseGxAlertMigration(
    {
      admin: {
        name: adminName,
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
      jobFunctions,
      contactsFromGxAlert,
      customFieldsFromGxAlert,
    },
    knex
  )

  const { id: partnerId } = await knex('Partner')
    .where({ name: partnerName })
    .first('id')

  await upsertDashboardWidgets(knex, partnerId)
}
