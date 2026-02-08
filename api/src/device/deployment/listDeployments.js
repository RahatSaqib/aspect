const { knex } = require('../../db')
const { getConstraints, addConstraints } = require('../../auth/constraints')

async function listDeployments(request) {
  const { params, auth } = request
  const { deviceId } = params
  const dataConstraints = await getConstraints(auth.credentials)

  const deployments = await knex('Deployment as dep')
    .leftJoin('Site as s', 'dep.siteId', 's.id')
    .where('dep.deviceId', deviceId)
    .modify(addConstraints, dataConstraints, { site: 's' })
    .select('dep.id', 'dep.siteId', 's.name as siteName', 'dep.start', 'dep.end')
    .orderBy([{ column: 'dep.start', order: 'desc' }])

  return { ok: true, data: deployments }
}

module.exports = { listDeployments }
