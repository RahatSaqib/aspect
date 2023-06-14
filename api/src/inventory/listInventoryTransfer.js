const { subDays } = require('date-fns')
const { getConstraints } = require('../auth/constraints')
const { getInventoryTransfer } = require('./common/db')

module.exports = async function (request) {
  const { auth, query } = request

  const dataConstraints = await getConstraints(auth.credentials)
  const now = new Date()

  if (!query.minDate) {
    query.minDate = subDays(now, 30).toISOString()
  }
  if (!query.maxDate) {
    query.maxDate = now.toISOString()
  }

  const { total, data } = await getInventoryTransfer(query, dataConstraints)
  return { ok: true, total, length: data.length, data }
}
