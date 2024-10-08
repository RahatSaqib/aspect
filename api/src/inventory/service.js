const { getConstraints } = require('../auth/constraints')
const { getReconciliationList } = require('./common/db')

async function listReconciliation(request) {
  const { auth, query } = request
  const dataConstraints = await getConstraints(auth.credentials)
  const [{ total }, data] = await getReconciliationList(query, dataConstraints)
  return { data, total, ok: true }
}

module.exports = {
  listReconciliation,
}
