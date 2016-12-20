const _ = require('lodash')

function* deleteTestDataFromCheckpoint(knex, checkpoint, deviceIds) {
  const { id: minDeviceLogUpdateId } = yield knex('DeviceLogUpdate as dlu')
    .innerJoin('DeviceLog as dl', 'dl.id', 'dlu.deviceLogId')
    .where('dl.checkpoint', checkpoint)
    .orderBy('dlu.id', 'desc')
    .first('dlu.id as id')

  const deviceUpdates = yield knex('DeviceLogUpdate as dlu')
    .innerJoin('DeviceLog as dl', 'dl.id', 'dlu.deviceLogId')
    .where('dlu.id', '>=', minDeviceLogUpdateId)
    .whereIn('dl.deviceId', deviceIds)
    .select(
      'dlu.id', 'dlu.deviceLogId', 'dlu.resultId',
      'dlu.deviceConfigurationId', 'dlu.deviceOperationId')

  const deviceLogIds = _.uniq(_.map(deviceUpdates, 'deviceLogId'))
  const resultIds = _.uniq(_.map(deviceUpdates, 'resultId'))
  const configIds = _.uniq(_.map(deviceUpdates, 'deviceConfigurationId'))
  const opIds = _.uniq(_.map(deviceUpdates, 'deviceOperationId'))

  for (const deviceId of deviceIds) {
    yield knex('Device')
      .where({ id: deviceId })
      .update({
        deviceOperationId: knex('DeviceOperation')
          .where({ deviceId })
          .whereNotIn('id', opIds)
          .max('id'),
        deviceConfigurationId: knex('DeviceConfiguration')
          .where({ deviceId })
          .whereNotIn('id', configIds)
          .max('id')
      })
  }

  yield knex('DeviceLogUpdate').whereIn('deviceLogId', deviceLogIds).delete()
  yield knex('DeviceLog').whereIn('id', deviceLogIds).delete()
  yield knex('InventoryLog').whereIn('resultId', resultIds).delete()
  yield knex('ResultWorkflowLog').whereIn('resultId', resultIds).delete()
  yield knex('Result').whereIn('id', resultIds).delete()
  yield knex('DeviceConfiguration').whereIn('id', configIds).delete()
  yield knex('DeviceOperation').whereIn('id', opIds).delete()
}

function* getLastDeviceConfigurationId(knex, deviceId) {
  const { deviceConfigurationId } = yield knex('Device')
    .where({ id: deviceId })
    .first('deviceConfigurationId')
  return deviceConfigurationId
}

function* getLastDeviceOperationId(knex, deviceId) {
  const { deviceOperationId } = yield knex('Device')
    .where({ id: deviceId })
    .first('deviceOperationId')
  return deviceOperationId
}

function* getLastResultId(knex, deviceId) {
  const result = yield knex('DeviceLogUpdate as dlu')
    .innerJoin('DeviceLog as dl', 'dl.id', 'dlu.deviceLogId')
    .where('dl.deviceId', deviceId)
    .whereNotNull('dlu.resultId')
    .orderBy('dlu.id', 'desc')
    .first('dlu.resultId')
  return result && result.resultId
}

module.exports = {
  deleteTestDataFromCheckpoint,
  getLastDeviceConfigurationId,
  getLastDeviceOperationId,
  getLastResultId
}
