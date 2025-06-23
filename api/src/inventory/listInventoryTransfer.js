const { subDays } = require('date-fns')
const { getConstraints } = require('../auth/constraints')
const { getInventoryTransfer } = require('./common/db')
const { getUser } = require('../auth/service')

module.exports = async function (request) {
  const { auth, query } = request
  const { timezoneIANA } = await getUser(auth.credentials.name)

  const dataConstraints = await getConstraints(auth.credentials)
  const now = new Date()

  if (!query.minDate) {
    query.minDate = subDays(now, 30).toISOString()
  }
  if (!query.maxDate) {
    query.maxDate = now.toISOString()
  }

  const { total, data } = await getInventoryTransfer(query, dataConstraints, timezoneIANA)
  return { ok: true, total, length: data.length, data }
}
