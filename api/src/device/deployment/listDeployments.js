const { knex } = require('../../db')
const { getConstraints, addConstraints } = require('../../auth/constraints')

async function listDeployments(request) {
  const { params, auth } = request
  const { deviceId } = params
  const dataConstraints = await getConstraints(auth.credentials)

  // NULL start (oldest/first deployment) sorts to the bottom for display (most recent first)
  const deployments = await knex('Deployment as dep')
    .leftJoin('Site as s', 'dep.siteId', 's.id')
    .where('dep.deviceId', deviceId)
    .modify(addConstraints, dataConstraints, {})
    .select('dep.id', 'dep.siteId', 's.name as siteName', 's.disabled as siteDisabled', 'dep.start', 'dep.end')
    .orderByRaw('dep.start IS NULL ASC, dep.start DESC')

  return { ok: true, data: deployments }
}

module.exports = { listDeployments }
