const { knex } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')

const SELECT_LIST_FIELDS = ['dt.id', 'dt.name', 'dt.externalId']

async function listDeviceTypesForSelectList(request) {
  const { auth } = request
  const dataConstraints = await getConstraints(auth.credentials)

  // only get the device types for which the partner has at least one device
  const data = await knex('DeviceType as dt')
    .innerJoin('Device as d', 'dt.id', 'd.deviceTypeId')
    .modify(addConstraints, dataConstraints, { device: 'd', deviceType: 'dt' })
    .select(SELECT_LIST_FIELDS)
    .orderBy('dt.name', 'asc')
    .distinct()

  return { ok: true, data }
}

module.exports = {
  listDeviceTypesForSelectList,
}
