module.exports = require('../utils').seed(seed, __filename)

const Promise = require('bluebird')
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
      usaid: '0JzBx1m6PV', // for jobFunction 'Donor'
    },
  })

  // --- ----------------------
  // --- Give admin access to notifications
  // --- ----------------------
  const modules = await getPermissionModules(knex)
  await upsertJobFunction(knex, 'Admin', partnerId, [modules.notification.edit])

  // --- ----------------------
  // --- Give all except donor and device maker access to task list
  // --- ----------------------
  await Promise.each(['Admin', 'Regional Officer', 'Lab User', 'NTP', 'Technician', 'Clinician'], async jobFunction =>
    upsertJobFunction(knex, jobFunction, partnerId, [modules.task.view, modules.taskMenu.view])
  )
}
