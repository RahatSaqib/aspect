module.exports = require('../utils').seed(seed, __filename)
const { countries } = require('./fixtures/geography.json')
const partnerData = require('./fixtures/partnerData')
const { upsertStatesAndLgas } = require('../common')

async function seed(knex) {
  const { id: countryId } = await knex('Country').where({ abbreviation: partnerData.partnerAbbreviation }).first()

  const { states } = countries[0]

  await upsertStatesAndLgas(knex, countryId, states)

  await knex('State')
    .update({ name: 'BANGSAMORO AUTONOMOUS REGION OF MUSLIM MINDANAO (BARMM)' })
    .where({ name: 'AUTONOMOUS REGION OF MUSLIM MINDANAO (ARMM)' })

  await knex('State').update({ name: 'MIMAROPA' }).where({ name: 'MiMaRoPa REGION' })
}
