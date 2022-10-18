const contacts = require('./fixtures/contacts.json')
const partnerData = require('./fixtures/partnerData')
const upsertContacts = require('../common/upsert_contacts')

module.exports = require('../utils').seed(async knex => upsertContacts(knex, partnerData, contacts), __filename)
