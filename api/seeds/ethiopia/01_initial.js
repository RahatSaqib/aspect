module.exports = require('../utils').seed(seed, __filename)

const _ = require('lodash')

const geographyFromGxAlert = require('./fixtures/geographyFromGxAlert.json')
const sitesFromGxAlert = require('./fixtures/sitesFromGxAlert.json')
const jobFunctionsFixture = require('./fixtures/jobFunctions')
const contactsFromGxAlert = require('./fixtures/contactsFromGxAlert.json')
const customFieldsFromGxAlert = require('./fixtures/customFieldsFromGxAlert.json')
const labClinic = require('./fixtures/labClinic.json')
const { baseGxAlertMigration, seedLabClinicFixture } = require('../common')
const { seedAbbottM2000AndAssays } = require('../utils_abbott_m2000')
const partnerData = require('./fixtures/partnerData')

async function seed(knex) {
  const migrationSeededData = await baseGxAlertMigration(
    {
      partner: {
        name: 'Ethiopia EPHI',
        serverUrl: 'https://ethiopia.aspect.id:8093',
      },
      geographyFromGxAlert,
      gxAlertDevice: {
        deviceApiKeyToken: '1tfw5604jfn09gx7upd0',
      },
      sitesFromGxAlert,
      jobFunctionsFixture,
      contactsFromGxAlert,
      customFieldsFromGxAlert,
    },
    knex,
    partnerData
  )
  await seedAbbottM2000AndAssays(knex)

  await seedLabClinicFixture(
    labClinic,
    _.pick(migrationSeededData, ['adminId', 'partnerId', 'countryId', 'statesByName']),
    knex
  )
}
