const { getConstraints } = require('../../auth/constraints')
const getSmsUse = require('./resultNotificationReport/getSmsUse')
const getEmailUse = require('./resultNotificationReport/getEmailUse')

async function getResultSmsNotificationData(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  const rows = await getSmsUse(dataConstraints, query)

  return {
    ok: true,
    data: rows,
    total: rows.length,
  }
}

async function getResultEmailNotificationData(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  const rows = await getEmailUse(dataConstraints, query)

  return {
    ok: true,
    data: rows,
    total: rows.length,
  }
}

module.exports = { getResultSmsNotificationData, getResultEmailNotificationData }
