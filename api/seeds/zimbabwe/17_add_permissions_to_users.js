module.exports = require('../utils').seed(seed, __filename)

const { upsertJobFunction } = require('../common')
const { getPermissionModules } = require('../utils')

async function seed(knex) {
  const modules = await getPermissionModules(knex)
  const partner = await knex('Partner').where('name', 'Zimbabwe').first('id')

  if (partner) {
    await upsertJobFunction(knex, 'NTP', partner.id, [modules.assay.view, modules.result.view, modules.site.view])
    await upsertJobFunction(knex, 'Technician', partner.id, [
      modules.assay.view,
      modules.result.view,
      modules.site.view,
    ])
    await upsertJobFunction(knex, 'Device Maker', partner.id, [
      modules.assay.view,
      modules.result.view,
      modules.site.view,
    ])
  }
}
