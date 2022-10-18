module.exports = require('../utils').seed(seed, __filename)

const geography = require('./fixtures/geography.json')
const { upsertStatesAndLgas } = require('../common')

async function seed(knex) {
  const { id: countryId } = await knex('Country').where('name', 'Nigeria').first('id')

  await upsertStatesAndLgas(knex, countryId, geography.countries[0].states)
}
