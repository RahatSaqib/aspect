module.exports = require('../utils').seed(seed, __filename)

const { upsertForms } = require('../utils')
const {
  partner: { externalId: partnerExternalId },
} = require('./fixtures/partnerData')
const forms = require('./fixtures/forms')

async function seed(knex) {
  const { id: partnerId } = await knex('Partner').where({ externalId: partnerExternalId }).first('id')

  await knex('FormDefinition').del()

  await upsertForms(knex, partnerId, forms)
}
