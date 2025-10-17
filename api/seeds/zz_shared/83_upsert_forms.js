module.exports = require('../utils').seed(seed, __filename)

const { upsertForms } = require('../utils')

async function seed(knex) {
  const fixturesDirectory = `${process.env['seeds.directory'].replace('./seeds/', '')}fixtures`
  const {
    partner: { externalId: partnerExternalId },
    // eslint-disable-next-line import/no-dynamic-require
  } = require(`../${fixturesDirectory}/partnerData`)
  // eslint-disable-next-line import/no-dynamic-require
  const formsFixture = require(`../${fixturesDirectory}/forms`)

  const { id: partnerId } = await knex('Partner').where({ externalId: partnerExternalId }).first('id')

  await knex('FormDefinition').del()

  await upsertForms(knex, partnerId, formsFixture)
}
