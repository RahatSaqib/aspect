const MODULE_TEMPERATURE_ERROR_CODES = [
  '1001',
  '1004',
  '1017',
  '2014',
  '2022',
  '4009',
  '4010',
]
const MODULE_POWER_ERROR_CODES = [
  '1007',
  '2122',
  '2123',
  '2126',
  '2127',
  '4008',
]

const MODULE_FAILURE_ERROR_CODES = [
  '1002',
  '1005',
  '1006',
  '1018',
  '2011',
  '2012',
  '2016',
  '2017',
  '2018',
  '2021',
  '2023',
  '2024',
  '2026',
  '2032',
  '2034',
  '2035',
  '3000',
  '4001',
  '4002',
  '4003',
  '4004',
  '4006',
  '4011',
  '4012',
  '4013',
  '4014',
  '4015',
  '4016',
  '4017',
  '4019',
  '5013',
  '5014',
  '5015',
  '5016',
]
const PROCEDURAL_ERROR_CODES = [
  '1096',
  '1097',
  '1098',
  '1099',
  '1100',
  '2096',
  '2097',
  '2098',
  '2099',
  '2100',
  '2125',
  '1125',
  '2005',
  '2006',
  '2008',
  '2009',
  '5006',
  '5007',
  '5008',
  '5009',
  '5010',
  '2003',
]

const REAGENT_HEALTH_ERROR_CODES = [
  '2037',
  '5001',
  '5002',
  '5003',
  '5004',
  '5005',
  '5011',
  '5017',
  '5018',
  '5019',
  '2025',
]

const moduleTemperatureMaxErrors = 4
const modulePowerMaxErrors = 4
const moduleFailureMaxErrors = 2
const machineTemperatureMaxErrors = 8
const minPrcntMachineTemperatureResolve = 1
const maxPrcntErrors = 5
const machinePowerMinNoResults = 8
const machinePowerMinErrorsNoResult = 8
const maxPrcntMachinePowerErrors = 3
const minPrcntMachinePowerResolve = 1
const maxInvalidResultRatio = 3
const invalidResultBatchRatio = 2
const maxReagentErrorRatio = 3
const maxInvalidReagentErrorRatio = 4
const minErrorsForLUGenericModuleIssue = 6
const minErrorsForLUGenericMachineIssue = 8
const minPrcntMachineProceduralResolve = 3
const minPrcntModuleProceduralResolve = 3

const minPrcntModuleUnknownErrors = 5
const moduleMaxUnknownErrors = 6
const machineMaxUnknownErrors = 8
const minErrorsInvalidsForReagentHealthIssue = 8

module.exports = {
  MODULE_TEMPERATURE_ERROR_CODES,
  MODULE_POWER_ERROR_CODES,
  MODULE_FAILURE_ERROR_CODES,
  PROCEDURAL_ERROR_CODES,
  REAGENT_HEALTH_ERROR_CODES,
  moduleTemperatureMaxErrors,
  modulePowerMaxErrors,
  moduleFailureMaxErrors,
  machineTemperatureMaxErrors,
  minPrcntMachineTemperatureResolve,
  maxPrcntErrors,
  machinePowerMinNoResults,
  machinePowerMinErrorsNoResult,
  maxPrcntMachinePowerErrors,
  minPrcntMachinePowerResolve,
  maxInvalidResultRatio,
  invalidResultBatchRatio,
  maxReagentErrorRatio,
  maxInvalidReagentErrorRatio,
  minErrorsForLUGenericModuleIssue,
  minErrorsForLUGenericMachineIssue,
  minPrcntMachineProceduralResolve,
  minPrcntModuleProceduralResolve,
  minPrcntModuleUnknownErrors,
  moduleMaxUnknownErrors,
  machineMaxUnknownErrors,
  minErrorsInvalidsForReagentHealthIssue,
}
