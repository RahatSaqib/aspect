module.exports = require('../utils').seed(seed, __filename)

const { upsertJobFunction, copyPermissionsAndDashboardWidgetsFromJobFunction } = require('../common')

async function seed(knex) {
  const { id: adminId } = await knex('User').where({ name: 'admin' }).first('id')

  const { id: adminPersonId } = await knex('Person').where({ userId: adminId }).first('id')

  const { id: partnerId } = await knex('Partner').where('name', 'Zimbabwe').first('id')

  // --- ----------------------
  // --- Create new job function for SystemOne admin
  // --- ----------------------
  const jobFunctionSystemOneId = await upsertJobFunction(knex, 'SystemOne', partnerId)
  await copyPermissionsAndDashboardWidgetsFromJobFunction(knex, 'admin', 'systemOne')

  // reassign existing admin user:
  await knex('Job').update('jobFunctionId', jobFunctionSystemOneId).where({ personId: adminPersonId })

  // --- ----------------------
  // --- Create new job function NTP users who
  // --- shouldn't be able to view result data
  // --- ----------------------
  const jobFunctionNtpNoResultsId = await upsertJobFunction(knex, 'NTP - No Results', partnerId, [], {
    reports: ['critical_errors_by_device', 'device_calibration_report'],
  })
  await copyPermissionsAndDashboardWidgetsFromJobFunction(knex, 'ntp', 'ntpNoResults', ['result'])

  // --- ----------------------
  // --- Move everyone in the admin role to NTP, except
  // --- users who are country admins in GxAlert
  // --- ----------------------
  const { id: jobFunctionNtpId } = await knex('JobFunction').where('externalId', 'ntp').first('id')
  await knex('Job as j')
    .join('JobFunction as jf', 'j.jobFunctionId', 'jf.id')
    .join('Person as p', 'j.personId', 'p.id')
    .join('User as u', 'p.userId', 'u.id')
    .update('jobFunctionId', jobFunctionNtpId)
    .where('jf.externalId', 'admin')
    .whereNotIn('u.name', [
      'tendainkomo.ak@gmail.com',
      'hmutunzi@gmail.com',
      'drkcharambira@gmail.com',
      'raynolds.mangena@cepheid.com',
      'sakubani@gmail.com',
      'amitchell@systemone.id',
    ])

  // --- ----------------------
  // --- Finally, move some users to NTP-No Result
  // --- ----------------------
  await knex('Job as j')
    .join('JobFunction as jf', 'j.jobFunctionId', 'jf.id')
    .join('Person as p', 'j.personId', 'p.id')
    .join('User as u', 'p.userId', 'u.id')
    .update('jobFunctionId', jobFunctionNtpNoResultsId)
    .whereIn('u.name', ['olinamutuwani@gmail.com', 'rumbychiwanza@gmail.com'])
}
