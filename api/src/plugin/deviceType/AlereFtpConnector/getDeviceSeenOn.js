async function getDeviceSeenOn({
  knex,
  device: { id: deviceId, deviceType },
  now,
}) {
  if (deviceType === 'AlereFtpConnector') {
    return now
  }
  const { changedOn } = (await knex
    .from('Result as r')
    .join('ResultWorkflowLog as rwl', 'r.id', 'rwl.resultId')
    .where('r.deviceId', deviceId)
    .orderBy('rwl.changedOn', 'desc')
    .first('rwl.changedOn')) || { changedOn: null }
  return changedOn
}

module.exports = getDeviceSeenOn
