const { getConstraints } = require('../auth/constraints')
const { getReconciliationList } = require('./reconciliation')

module.exports = async function (request) {
  const { auth, query } = request
  const dataConstraints = await getConstraints(auth.credentials)
  const data = await getReconciliationList(query, dataConstraints)
  return { data, ok: true }
}
