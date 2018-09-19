async function getDeviceSeenOn({
  knex,
  device: { id: deviceId, deviceType },
  now,
}) {
  if (deviceType === 'AlereFtpConnector') {
    return now
  }
  const { startedOn } = (await knex
    .from('Result')
    .where('deviceId', deviceId)
    .orderBy('startedOn', 'desc')
    .first('startedOn')) || { startedOn: null }
  return startedOn
}

module.exports = getDeviceSeenOn
