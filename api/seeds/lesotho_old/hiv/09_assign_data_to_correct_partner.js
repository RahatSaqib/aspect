module.exports = require('../../utils').seed(seed, __filename)

const partnerData = require('./fixtures/partnerData')
const sitesFromGxAlert = require('./fixtures/sitesFromGxAlert.json')
const contactsFromGxAlert = require('./fixtures/contactsFromGxAlert.json')
const customFieldsFromGxAlert = require('./fixtures/customFieldsFromGxAlert.json')

const sharedSeed = require('../shared/09_assign_data_to_correct_partner')

async function seed(knex) {
  await sharedSeed(
    knex,
    sitesFromGxAlert,
    contactsFromGxAlert,
    ['GxMtbRif', 'GxMtbRifUltra'],
    customFieldsFromGxAlert,
    'hiv',
    partnerData
  )
}
