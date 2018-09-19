async function getLastTestDate(knex, deviceId) {
  const { startedOn } = (await knex
    .from('Result')
    .where('deviceId', deviceId)
    .orderBy('startedOn', 'desc')
    .first('startedOn')) || { startedOn: null }
  return startedOn
}

async function getFirstTestDate(knex, deviceId) {
  const { startedOn } = (await knex
    .from('Result')
    .where('deviceId', deviceId)
    .orderBy('startedOn', 'desc')
    .first('startedOn')) || { startedOn: null }
  return startedOn
}

module.exports = { getLastTestDate, getFirstTestDate }
