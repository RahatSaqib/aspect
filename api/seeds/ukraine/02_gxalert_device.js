module.exports = require('../utils').seed(seed, __filename)

const _ = require('lodash')

const jobFunctionsFixture = require('./fixtures/jobFunctions')
const contactsFromGxAlert = require('./fixtures/contactsFromGxAlert.json')
const customFieldsFromGxAlert = require('./fixtures/customFieldsFromGxAlert.json')
const geographyFromGxAlert = require('./fixtures/geography.json')
const sitesFromGxAlert = require('./fixtures/sitesFromGxAlert.json')
const labClinic = require('./fixtures/labClinic.json')

const { baseGxAlertMigration, seedLabClinicFixture, upsertDashboardWidgets } = require('../common')
const partnerData = require('./fixtures/partnerData')

async function seed(knex) {
  const migrationSeededData = await baseGxAlertMigration(
    {
      admin: {
        name: 'ukraine',
      },
      partner: {
        name: 'Ukraine',
        serverUrl: 'https://ukraine.aspect.id',
      },
      geographyFromGxAlert,
      gxAlertDevice: {
        deviceApiKeyToken: 'qqsmc85rzlaoh9aygzh2',
      },
      sitesFromGxAlert,
      jobFunctionsFixture,
      contactsFromGxAlert,
      customFieldsFromGxAlert,
    },
    knex,
    partnerData
  )

  await seedLabClinicFixture(
    labClinic,
    _.pick(migrationSeededData, ['adminId', 'partnerId', 'countryId', 'statesByName']),
    knex
  )

  const { id: partnerId } = await knex('Partner').where({ name: 'Ukraine' }).first('id')

  await upsertDashboardWidgets(knex, partnerId)
}
