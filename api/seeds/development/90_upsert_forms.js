module.exports = require('../utils').seed(seed, __filename)

const { upsertForms } = require('../utils')

const {
  partner: { externalId: partnerExternalId },
  fixtures: { forms: formsFixture },
  // eslint-disable-next-line import/no-dynamic-require
} = require(`../${process.env['seeds.directory'].replace('./seeds/', '')}/fixtures/partnerData`)

async function seed(knex) {
  const { id: partnerId } = await knex('Partner').where({ externalId: partnerExternalId }).first('id')

  await knex('FormDefinition').del()

  await upsertForms(knex, partnerId, formsFixture)
}
