module.exports = require('../utils').seed(seed, __filename, {
  seedsFolder: 'ethiopia',
  staticDataFiles: ['Disease', 'AssayType'],
})

const _ = require('lodash')

const geographyFromGxAlert = require('./fixtures/geographyFromGxAlert.json')
const sitesFromGxAlert = require('./fixtures/sitesFromGxAlert.json')
const jobFunctions = require('./fixtures/jobFunctions.json')
const contactsFromGxAlert = require('./fixtures/contactsFromGxAlert.json')
const customFieldsFromGxAlert = require('./fixtures/customFieldsFromGxAlert.json')
const labClinic = require('./fixtures/labClinic.json')
const { baseGxAlertMigration, seedLabClinicFixture } = require('../common')
const { seedAbbottM2000AndAssays } = require('../utils_abbott_m2000')

async function seed(knex) {
  const partnerName = 'Ethiopia EPHI'
  const migrationSeededData = await baseGxAlertMigration(
    {
      partner: {
        name: partnerName,
        serverUrl: 'https://ethiopia.aspect.id:8093',
      },
      geographyFromGxAlert,
      gxAlertDevice: {
        deviceApiKeyToken: '1tfw5604jfn09gx7upd0',
      },
      sitesFromGxAlert,
      jobFunctions,
      contactsFromGxAlert,
      customFieldsFromGxAlert,
    },
    knex
  )
  await seedAbbottM2000AndAssays(knex)

  await seedLabClinicFixture(
    labClinic,
    _.pick(migrationSeededData, [
      'adminId',
      'partnerId',
      'countryId',
      'statesByName',
    ]),
    knex
  )
}
