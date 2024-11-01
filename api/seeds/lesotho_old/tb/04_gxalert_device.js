module.exports = require('../../utils').seed(seed, __filename)

const sharedSeed = require('../shared/04_gxalert_device')
const contactsFromGxAlert = require('./fixtures/contactsFromGxAlert.json')
const customFieldsFromGxAlert = require('./fixtures/customFieldsFromGxAlert.json')
const sitesFromGxAlert = require('./fixtures/sitesFromGxAlert.json')
const partnerData = require('./fixtures/partnerData')

async function seed(knex) {
  await sharedSeed(knex, contactsFromGxAlert, customFieldsFromGxAlert, sitesFromGxAlert, partnerData)
}
