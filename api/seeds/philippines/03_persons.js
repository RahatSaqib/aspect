module.exports = require('../utils').seed(seed, __filename, {
  seedsFolder: 'philippines',
  staticDataFiles: ['AssayType'],
})
const { getGeographyId } = require('../utils')
const { readJson } = require('fs-extra')
const _ = require('lodash')

const fixturesPath = `${__dirname}/fixtures/`

async function seed(knex) {
  // Create admin user and audit fields
  const personFixture = await readJson(`${fixturesPath}/Person.json`)
  for (const p of personFixture) {
    const person = _.omit(p, ['countryId', 'stateId', 'lgaId'])
    // eslint-disable-next-line no-await-in-loop
    const { geographyId } = await getGeographyId(
      knex,
      p.countryId,
      p.stateId,
      p.lgaId
    )
    person.geographyId = geographyId

    // eslint-disable-next-line no-await-in-loop
    await knex('Person').insert(person)
  }
}
