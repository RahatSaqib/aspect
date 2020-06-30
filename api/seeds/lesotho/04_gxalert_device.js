module.exports = require('../utils').seed(seed, __filename)

const jobFunctions = require('./fixtures/jobFunctions.json')
const contactsFromGxAlert = require('./fixtures/contactsFromGxAlert.json')
const customFieldsFromGxAlert = require('./fixtures/customFieldsFromGxAlert.json')
const geographyFromGxAlert = require('./fixtures/geography.json')
const sitesFromGxAlert = require('./fixtures/sitesFromGxAlert.json')

const { baseGxAlertMigration, upsertDashboardWidgets } = require('../common')

async function seed(knex) {
  const deviceApiKeyToken = 'auv294emdbaervaeqzxc'
  await knex('DeviceApiKey').update('token', deviceApiKeyToken)

  await baseGxAlertMigration(
    {
      admin: {
        name: 'lesotho',
      },
      partner: {
        name: 'Lesotho',
        serverUrl: 'https://lesotho.aspect.id',
      },
      geographyFromGxAlert,
      gxAlertDevice: {
        deviceApiKeyToken,
      },
      sitesFromGxAlert,
      jobFunctions,
      contactsFromGxAlert,
      customFieldsFromGxAlert,
    },
    knex
  )

  const { id: partnerId } = await knex('Partner')
    .where({ name: 'Lesotho' })
    .first('id')

  await upsertDashboardWidgets(knex, partnerId)
}
