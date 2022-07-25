module.exports = require('../utils').seed(seed, __filename)

async function seed(knex) {
  // It fixes the GxHivVL assay configuration over the actual data and also insert missing categories for it.
  const { id: lastPartnerId } = await knex('Partner').first()
  const { id: lastCountryId } = await knex('Country').first()
  const { id: jobFunctionId } = await knex('JobFunction').where({ name: 'Admin' }).first()
  const { id: adminId } = await knex('Person').where({ name: 'Admin' }).first()

  await Promise.all([
    await knex('Job').insert({ personId: adminId, jobFunctionId }),
    await knex('Person').where({ id: adminId }).update({ lastPartnerId, lastCountryId }),
  ])
}
