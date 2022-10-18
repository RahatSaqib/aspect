module.exports = require('../utils').seed(seed, __filename)

const bcrypt = require('bcrypt')
const Promise = require('bluebird')
const contacts = require('./fixtures/RiversContacts.json')
const upsertContacts = require('../common/upsert_contacts')
const partnerData = require('./fixtures/partnerData')
const config = require('../../src/config')
const contactToUpdate = require('./fixtures/clinicians')

const saltRounds = parseInt(config.passwordSaltRounds, 10)
async function seed(knex) {
  await upsertContacts(knex, partnerData, contacts)
  await Promise.each(contactToUpdate, async contact => {
    await knex('User')
      .where('name', contact.email)
      .update({ password: bcrypt.hashSync(contact.password, saltRounds) })
  })
}
