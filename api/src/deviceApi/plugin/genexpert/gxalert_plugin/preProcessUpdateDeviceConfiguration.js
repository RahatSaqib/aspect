const _ = require('lodash')
const dateFormat = require('date-fns/format')

async function preProcessUpdateDeviceConfiguration(context) {
  const { payload, device: { id: deviceId } } = context
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
    const resolveOn =
      newMaintenanceData.expectedBackOnline == null
        ? null
        : new Date(newMaintenanceData.expectedBackOnline)
    context.deviceMaintenance(deviceId, {
      data: newMaintenanceData,
      resolveOn,
    })
  }
}

module.exports = preProcessUpdateDeviceConfiguration
