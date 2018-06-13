const { knex } = require('../db')

const SELECT_LIST_FIELDS = ['dt.id', 'dt.name']

async function listDeviceTypesForSelectList() {
  const data = await knex('DeviceType as dt')
    .orderBy(['dt.name'], 'asc')
    .select(SELECT_LIST_FIELDS)

  return { ok: true, data }
}

module.exports = {
  listDeviceTypesForSelectList,
}
