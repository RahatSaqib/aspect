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
      String(currentMaintenanceData.expectedBackOnline) !==
        String(expectedBackOnline)
    ) {
      if (newMaintenanceStatusId !== currentMaintenanceStatusId) {
        console.log(newMaintenanceStatusId, currentMaintenanceStatusId)
      }
      if (currentMaintenanceData.reason !== reason) {
        console.log(currentMaintenanceData.reason, reason)
      }
      if (currentMaintenanceData.note !== note) {
        console.log(currentMaintenanceData.note, note)
      }
      if (
        String(currentMaintenanceData.expectedBackOnline) !==
        String(expectedBackOnline)
      ) {
        console.log(
          String(currentMaintenanceData.expectedBackOnline),
          String(expectedBackOnline)
        )
      }
      const newMaintenanceData = _.merge({}, blankMaintenanceData, {
        reason: inactive ? reason : null,
        note: inactive ? note : null,
        expectedBackOnline: inactive ? expectedBackOnline : null,
      })
      await knex('DeviceMaintenanceStatusLog').insert({
        deviceId,
        deviceMaintenanceStatusId: newMaintenanceStatusId,
        data: JSON.stringify(newMaintenanceData),
        changedOn: now,
        createdOn: now,
      })
    }
  }
}

module.exports = preProcessUpdateDeviceConfiguration
