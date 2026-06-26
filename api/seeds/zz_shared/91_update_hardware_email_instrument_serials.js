const { updateIssueNotificationTemplates } = require('../utils')

module.exports = require('../utils').seed(seed, __filename)

async function seed(knex) {
  await updateIssueNotificationTemplates(
    knex,
    [
      'HardwareSyringeStallError',
      'HardwareSyringePressureTooHigh',
      'HardwareUltrasonicHornCurrentOutOfRange',
      'HardwareUltrasonicHornTuningError',
      'HardwareUltrasonicHornFailure',
      'HardwareCartridgeIntegrityTestFailure',
      'HardwareAssaySpecificTerminationError',
      'HardwareAssaySpecificTerminationError2',
      'HardwarePowerSupplyVoltageOutOfRange',
      'HardwareTemperatureErrors',
    ],
    { userName: 'admin' }
  )
}
