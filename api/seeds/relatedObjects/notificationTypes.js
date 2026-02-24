const { allJobFunctionToId } = require('../../src/shared/dictionary')

async function getBaseNotificationTypes() {
  const jobFunctions = await allJobFunctionToId()
  const allJobFunctions = Object.values(jobFunctions)

  const labUserAndTechnician = [jobFunctions.labUser, jobFunctions.technician]

  const notifyLabUserAndTechnician = {
    alert: allJobFunctions,
    sms: labUserAndTechnician,
    email: labUserAndTechnician,
  }

  const notifyTechnician = {
    alert: allJobFunctions,
    sms: [jobFunctions.technician],
    email: [jobFunctions.technician],
  }

  const notificationTypeDefinition = {
    DeviceOffline: notifyLabUserAndTechnician,
    DeviceNoResults: notifyLabUserAndTechnician,
    InventoryStockExpiring: notifyLabUserAndTechnician,
    DeviceMaintenance: notifyTechnician,
    ModuleFailureError: notifyTechnician,
    UnusedModules: notifyTechnician,
    ModuleTemperatureError: notifyTechnician,
    ModulePowerError: notifyTechnician,
    MachineTemperatureError: notifyTechnician,
    ModuleProceduralError: notifyTechnician,
    MachineProceduralError: notifyTechnician,
    DataCategoryLowError: notifyTechnician,
    StockLevelUpdate: notifyTechnician,
    ReagentHealthError: notifyTechnician,
    MachineGenericError: notifyTechnician,
    ModuleGenericError: notifyTechnician,
    ModuleReplaced: notifyTechnician,
    ModuleDisabled: notifyTechnician,
    TooManyInvalidResultsModule: notifyTechnician,
    TooManyInvalidResultsLot: notifyTechnician,
    ProbeCheckTooHighModule: notifyTechnician,
    ProbeCheckTooHighLot: notifyTechnician,
    FailedToVerifyValidBackgroundErrorForAnalyteModule: notifyTechnician,
    FailedToVerifyValidBackgroundErrorForAnalyteLot: notifyTechnician,
    ProbeCheckFailedModule: notifyTechnician,
    ProbeCheckFailedLot: notifyTechnician,
    SignalLossDetectedInAmplificationCurveModule: notifyTechnician,
    SignalLossDetectedInAmplificationCurveLot: notifyTechnician,
    CartridgeIntegrityTestFailureLot: notifyTechnician,
    SyringePressureTooHighLot: notifyTechnician,
    SyringeStallErrorLot: notifyTechnician,
    UltrasonicHornFailureModule: notifyTechnician,
    UltrasonicHornTuningErrorModule: notifyTechnician,
    UltrasonicHornCurrentOutOfRangeModule: notifyTechnician,
    AssaySpecificTerminationError1Module: notifyTechnician,
    AssaySpecificTerminationError1Lot: notifyTechnician,
    AssaySpecificTerminationError2Module: notifyTechnician,
    AssaySpecificTerminationError2Lot: notifyTechnician,
    HardwareTemperatureDriftedFromSetPoint: notifyTechnician,
    HardwareHeaterTemperatureDifferentialError: notifyTechnician,
    HardwareSyringeStallError: notifyTechnician,
    HardwareSyringePressureTooHigh: notifyTechnician,
    HardwareThermistorTemperatureOutOfRange2014: notifyTechnician,
    HardwareUltrasonicHornCurrentOutOfRange: notifyTechnician,
    HardwareUltrasonicHornTuningError: notifyTechnician,
    HardwareUltrasonicHornFailure: notifyTechnician,
    HardwareCartridgeIntegrityTestFailure: notifyTechnician,
    HardwareAssaySpecificTerminationError: notifyTechnician,
    HardwareAssaySpecificTerminationError2: notifyTechnician,
    HardwareModuleWasReset: notifyTechnician,
    HardwarePowerSupplyVoltageOutOfRange: notifyTechnician,
    HardwareHeaterATemperatureUnstable: notifyTechnician,
    HardwareHeaterBTemperatureUnstable: notifyTechnician,
    HardwareThermistorTemperatureOutOfRange4017: notifyTechnician,
  }
  return notificationTypeDefinition
}

module.exports = {
  getBaseNotificationTypes,
}
