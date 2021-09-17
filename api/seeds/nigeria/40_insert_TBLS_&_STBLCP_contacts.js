module.exports = require('../utils').seed(seed, __filename)

const contacts = require('./fixtures/contacts.json')
const upsertContacts = require('../common/upsert_contacts')
const upsertJobFunctions = require('../common/upsert_reports_&_job_functions')
const jobFunctionFixture = require('./fixtures/jobFunctions')
const partnerData = require('./fixtures/partnerData')

async function seed(knex) {
  await upsertContacts(knex, partnerData, contacts)
  // Needed for adding Regional Officer access to the Reporter List
  await upsertJobFunctions(knex, jobFunctionFixture, partnerData.partnerName)
}
