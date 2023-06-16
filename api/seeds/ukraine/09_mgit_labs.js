module.exports = require('../utils').seed(seed, __filename)

const labClinic = require('./fixtures/labClinic.json')

const { getPartnerByExternalId } = require('../utils')
const { seedLabClinicFixture, getStatesByName } = require('../common')

async function seed(knex) {
  const { id: adminId } = await knex('User').where({ name: 'admin' }).first('id')
  const { id: partnerId } = await getPartnerByExternalId(knex, 'Ukraine')
  const { id: countryId } = await knex('Country').where('name', 'Ukraine').first('id')
  const statesByName = await getStatesByName(knex, countryId)
  await seedLabClinicFixture(
    labClinic,
    {
      adminId,
      partnerId,
      countryId,
      statesByName,
    },
    knex
  )
}
