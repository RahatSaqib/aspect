const { knex } = require('../db')

const SELECT_LIST_FIELDS = ['dt.id', 'dt.name']

async function listDeviceTypesForSelectList() {
  // only get the device types for which the partner has at least one device
  const data = await knex('DeviceType as dt')
    .innerJoin('Device as d', 'dt.id', 'd.deviceTypeId')
    .whereNotNull('d.partnerId')
    .orderBy(['dt.name'], 'asc')
    .select(SELECT_LIST_FIELDS)
    .distinct()

  return { ok: true, data }
}

module.exports = {
  listDeviceTypesForSelectList,
}
