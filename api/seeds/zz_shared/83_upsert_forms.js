module.exports = require('../utils').seed(seed, __filename)

const { upsertForms } = require('../utils')

async function seed(knex) {
  const seedsDir = process.env['seeds.directory'].replace('./seeds/', '').replace(/\/$/, '')
  const fixturesDirectory = `${seedsDir}/fixtures`
  const {
    partner: { externalId: partnerExternalId },
    // eslint-disable-next-line import/no-dynamic-require
  } = require(`../${fixturesDirectory}/partnerData`)

  let formsFixture
  try {
    // eslint-disable-next-line import/no-dynamic-require
    formsFixture = require(`../${fixturesDirectory}/forms`)
  } catch {
    // support for countries without custom fields
    return
  }

  const { id: partnerId } = await knex('Partner').where({ externalId: partnerExternalId }).first('id')

  await knex('FormDefinition').del()

  await upsertForms(knex, partnerId, formsFixture)
}
