const { knex } = require('../../db')
const { getConstraints, addConstraints, getUserFromCredentials } = require('../../auth/constraints')

async function listDeployments(request) {
  const { params, auth } = request
  const { deviceId } = params
  const [dataConstraints, user] = await Promise.all([
    getConstraints(auth.credentials),
    getUserFromCredentials(auth.credentials),
  ])

  const deployments = await knex('Deployment as dep')
    .leftJoin('Site as s', 'dep.siteId', 's.id')
    .where('dep.deviceId', deviceId)
    .modify(addConstraints, dataConstraints, { site: 's' })
    .select('dep.id', 'dep.siteId', 's.name as siteName', 'dep.start', 'dep.end')
    .orderBy([{ column: 'dep.start', order: 'desc' }])

  const timezoneIANA = user?.timezoneIANA ?? user?.personTimezoneIANA ?? null

  return { ok: true, data: deployments, timezoneIANA }
}

module.exports = { listDeployments }
