module.exports = require('../utils').seed(seed, __filename)

const { upsertForms } = require('../utils')
const { partnerName } = require('./fixtures/partnerData')
const forms = require('./fixtures/forms')

async function seed(knex) {
  const { id: partnerId } = await knex('Partner')
    .where({ name: partnerName })
    .first('id')

  await upsertForms(knex, partnerId, forms)
}
