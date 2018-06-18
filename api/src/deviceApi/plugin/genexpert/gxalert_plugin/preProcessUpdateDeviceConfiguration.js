const _ = require('lodash')
const dateFormat = require('date-fns/format')
const {
  deviceMaintenance,
  deviceMaintenanceResolved,
} = require('../../../../device/actions')
const { parseDateOrDefault } = require('../../../../shared/date')

async function preProcessUpdateDeviceConfiguration(context) {
  const { payload, device: { id: deviceId }, messageContext } = context
  const inactive = _.get(payload, 'data.inactive', null)
  if (!_.isNull(inactive)) {
    const blankMaintenanceData = {
      reason: null,
      note: null,
      expectedBackOnline: null,
    }
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
    const dueOn = parseDateOrDefault(newMaintenanceData.expectedBackOnline)
    if (inactive) {
      messageContext.dispatch(
        deviceMaintenance(deviceId, {
          dueOn,
          data: newMaintenanceData,
        })
      )
    } else {
      messageContext.dispatch(deviceMaintenanceResolved(deviceId))
    }
  }
}

module.exports = preProcessUpdateDeviceConfiguration
