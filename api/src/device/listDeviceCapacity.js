const { getConstraints, addConstraints } = require('../auth/constraints')
const { knex } = require('../db')

module.exports = async function ({ query, auth }) {
  const { deviceTypeId } = query
  const dataConstraints = await getConstraints(auth.credentials)

  const data = await knex('DeviceCapacity as dc')
    .innerJoin('DeviceType as dt', 'dc.deviceTypeId', 'dt.id')
    .innerJoin('Partner as p', 'dc.partnerId', 'p.id')
    .modify(addConstraints, dataConstraints, { partner: 'p' })
    .where({ externalId: deviceTypeId })
    .select('dc.id', 'dc.name', 'dc.dailyCapacity')

  return { ok: true, data }
}
