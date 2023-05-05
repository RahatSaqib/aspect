const { getConstraints } = require('../auth/constraints')
const { getInventoryTransfer } = require('./common/db')

module.exports = async function (request) {
  const { auth, query } = request

  const dataConstraints = await getConstraints(auth.credentials)

  const { total, data } = await getInventoryTransfer(query, dataConstraints)
  return { ok: true, total, length: data.length, data }
}
