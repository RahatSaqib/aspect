module.exports = require('../utils').seed(seed, __filename)

const { upsertJobFunction } = require('../common')
const { getPermissionModules, seedJobFunctionsAndUsersForOperationalData } = require('../utils')

async function seed(knex) {
  const now = new Date()
  const { id: adminId } = await knex('User').where({ name: 'admin' }).first('id')
  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }
  const { id: countryId, culture, timezone } = await knex('Country').where('abbreviation', 'ZW').first()
  const { id: partnerId } = await knex('Partner').where('name', 'Zimbabwe').first('id')

  await seedJobFunctionsAndUsersForOperationalData(knex, {
    auditFields,
    countryId,
    culture,
    partnerId,
    timezone,
    passwords: {
      cepheid: '54wzDZPtOs', // for jobFunction 'Device Maker'
      ntp: '78oc1ZPtOs', // for jobFunction 'NTP'
      technician: '39wzDWEtBd', // for jobFunction 'Technician'
      usaid: '0JzBx1m6PV', // for jobFunction 'Donor'
    },
  })

  // --- ----------------------
  // --- give existing 'admin' user access to operational-data
  // --- ----------------------
  const modules = await getPermissionModules(knex)
  const partner = await knex('Partner').where('name', 'Zimbabwe').first('id')
  if (adminId && partner) {
    await upsertJobFunction(knex, 'Admin', partner.id, [modules.operationalData.edit])
  }
}
