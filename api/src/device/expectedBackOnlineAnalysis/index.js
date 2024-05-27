const { getOverdueDevices } = require('./db')
const { deviceExpectedBackOnline } = require('../actions')

async function onExpectedBackOnlineAnalysis(_, { messageContext }) {
  const context = messageContext.bindActionCreators({
    deviceExpectedBackOnline,
  })

  return context.run(async knex => {
    const devicesOverdue = await getOverdueDevices(knex)

    devicesOverdue.forEach(device => {
      if (isOverdue(device)) {
        context.deviceExpectedBackOnline(device.deviceId, device.maintenanceDueOn)
      }
    })
  })

  function isOverdue(device) {
    return device.maintenanceDueOn < new Date()
  }
}

module.exports = onExpectedBackOnlineAnalysis
