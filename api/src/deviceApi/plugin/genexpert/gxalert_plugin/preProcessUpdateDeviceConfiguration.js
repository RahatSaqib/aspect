const _ = require('lodash')
const geneXpertPreProcessUpdateDeviceConfiguration = require('../preProcessUpdateDeviceConfiguration')

async function preProcessUpdateDeviceConfiguration(context) {
  await geneXpertPreProcessUpdateDeviceConfiguration(context)

  const { knex, payload, device: { id: deviceId }, now } = context
  const inactive = _.get(payload, 'data.inactive', null)
  if (!_.isNull(inactive)) {
    const {
      deviceMaintenanceStatusId: currentMaintenanceStatusId,
      data,
    } = await knex('Device as d')
      .leftJoin('DeviceMaintenanceStatusLog as dmsl', 'd.id', 'dmsl.deviceId')
      .leftJoin(
        'DeviceMaintenanceStatus as dms',
        'dmsl.deviceMaintenanceStatusId',
        'dms.id'
      )
      .where('d.id', deviceId)
      .orderBy('dmsl.changedOn', 'desc')
      .first('dmsl.deviceMaintenanceStatusId', 'dmsl.data')
    const blankMaintenanceData = {
      reason: null,
      note: null,
      expectedBackOnline: null,
    }
    const currentMaintenanceData = _.isEmpty(data)
      ? blankMaintenanceData
      : _.merge({}, blankMaintenanceData, JSON.parse(data))

    const { deviceMaintenanceStatusId: newMaintenanceStatusId } = await knex(
      'DeviceMaintenanceStatus as dms'
    )
      .where('dms.token', inactive ? 'offline' : 'online')
      .first('dms.id as deviceMaintenanceStatusId')

    const reason = _.get(payload, 'data.inactiveMaintenanceReason', null)
    const note = _.get(payload, 'data.inactiveMaintenanceNote', null)
    const expectedBackOnline = _.get(
      payload,
      'data.inactiveMaintenanceExpectedBackOnline',
      null
    )
    if (
      newMaintenanceStatusId !== currentMaintenanceStatusId ||
      currentMaintenanceData.reason !== reason ||
      currentMaintenanceData.note !== note ||
      currentMaintenanceData.expectedBackOnline !== expectedBackOnline
    ) {
      const newMaintenanceData = _.merge({}, blankMaintenanceData, {
        reason,
        note,
        expectedBackOnline,
      })
      await knex('DeviceMaintenanceStatusLog').insert({
        deviceId,
        deviceMaintenanceStatusId: newMaintenanceStatusId,
        data: newMaintenanceData,
        changedOn: now,
        createdOn: now,
      })
    }
  }
}

module.exports = preProcessUpdateDeviceConfiguration
