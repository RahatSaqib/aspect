const _ = require('lodash')
const dateFormat = require('date-fns/format')
const geneXpertPreProcessUpdateDeviceConfiguration = require('../preProcessUpdateDeviceConfiguration')
const { deviceSeen, deviceOffline } = require('../../../../device/actions')

async function preProcessUpdateDeviceConfiguration(context) {
  await geneXpertPreProcessUpdateDeviceConfiguration(context)
  const {
    knex,
    payload,
    device: { id: deviceId },
    now,
    messageContext,
  } = context
  const lastPingOn = _.get(payload, 'data.lastPingOn', null)
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
      .orderByRaw('dmsl.changedOn DESC, dmsl.id DESC')
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
    const expectedBackOnlineInData = _.get(
      payload,
      'data.inactiveMaintenanceExpectedBackOnline',
      null
    )
    const newMaintenanceData = _.assign({}, blankMaintenanceData, {
      reason: inactive
        ? _.get(payload, 'data.inactiveMaintenanceReason', null)
        : null,
      note: inactive
        ? _.get(payload, 'data.inactiveMaintenanceNote', null)
        : null,
      expectedBackOnline:
        !inactive || _.isEmpty(expectedBackOnlineInData)
          ? null
          : dateFormat(expectedBackOnlineInData, 'YYYY-MM-DD'),
    })
    if (
      newMaintenanceStatusId !== currentMaintenanceStatusId ||
      !_.isEqual(currentMaintenanceData, newMaintenanceData)
    ) {
      await knex('DeviceMaintenanceStatusLog').insert({
        deviceId,
        deviceMaintenanceStatusId: newMaintenanceStatusId,
        data: JSON.stringify(newMaintenanceData),
        changedOn: now,
        createdOn: now,
      })
      if (inactive) {
        messageContext.dispatch(deviceOffline(deviceId))
      } else {
        messageContext.dispatch(deviceSeen(deviceId, lastPingOn))
      }
    }
  }
}

module.exports = preProcessUpdateDeviceConfiguration
