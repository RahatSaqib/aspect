module.exports = require('../utils').seed(seed, __filename, {
  seedsFolder: 'philippines',
  staticDataFiles: ['AssayType'],
})
const { getGeographyId, getPartnerByName } = require('../utils')
const { readJson } = require('fs-extra')
const _ = require('lodash')

const fixturesPath = `${__dirname}/fixtures/`

async function seed(knex) {
  // Create admin user and audit fields
  const sitesFixture = await readJson(`${fixturesPath}/Sites.json`)
  const partner = await getPartnerByName(knex, 'Philippines')
  for (const s of sitesFixture) {
    const site = _.omit(s, ['country_id', 'state_id', 'lga_id'])
    site.partnerId = partner.id
    // eslint-disable-next-line no-await-in-loop
    const { geographyId } = await getGeographyId(
      knex,
      s.country_id,
      s.state_id,
      s.lga_id
    )
    site.geographyId = geographyId

    // eslint-disable-next-line no-await-in-loop
    await knex('Site').insert(site)
  }
}
