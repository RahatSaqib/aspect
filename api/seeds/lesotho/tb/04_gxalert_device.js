module.exports = require('../../utils').seed(seed, __filename)

const sharedSeed = require('../shared/04_gxalert_device')
const contactsFromGxAlert = require('./fixtures/contactsFromGxAlert.json')
const customFieldsFromGxAlert = require('./fixtures/customFieldsFromGxAlert.json')
const sitesFromGxAlert = require('./fixtures/sitesFromGxAlert.json')
const {
  adminUserName,
  adminPassword,
  partnerName,
  gxAlertDeviceApiKey,
} = require('./fixtures/partnerVariables.json')

async function seed(knex) {
  await sharedSeed(
    knex,
    contactsFromGxAlert,
    customFieldsFromGxAlert,
    sitesFromGxAlert,
    adminUserName,
    adminPassword,
    partnerName,
    gxAlertDeviceApiKey
  )
}
