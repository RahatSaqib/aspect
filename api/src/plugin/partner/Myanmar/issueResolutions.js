const subDays = require('date-fns/sub_days')

const {
  MODULE_FAILURE_ERROR_CODES,
  MODULE_POWER_ERROR_CODES,
  MODULE_TEMPERATURE_ERROR_CODES,
  machineTemperatureMaxErrors,
  moduleFailureMaxErrors,
  modulePowerMaxErrors,
  moduleTemperatureMaxErrors,
} = require('./errors')

async function resolveModuleFailureError(knex, issue) {
  const last30day = subDays(new Date(), 30)
  const issueData = JSON.parse(issue.data) || {}
  const modules = await knex('Result as r')
    .innerJoin('ResultCategory as rc', 'r.resultCategory1', 'rc.id')
    .where('rc.externalId', 'Error')
    .where('r.deviceId', issue.deviceId)
    .where('r.endedOn', '>=', last30day)
    .whereIn('r.errorCode', MODULE_FAILURE_ERROR_CODES)
    .select(
      'r.moduleSerial as moduleSerial',
      knex.raw('coalesce(r.moduleName, r.moduleSerial) as resultModuleName')
    )
    .count('r.id as errorCount')
    .groupBy('r.moduleSerial')
  const [module] = modules.filter(
    mod => mod.resultModuleName === issueData.resultModuleName
  )
  return module != null && module.errorCount <= moduleFailureMaxErrors
}

async function resolveModuleTemperatureError(knex, issue) {
  const last30day = subDays(new Date(), 30)
  const issueData = JSON.parse(issue.data) || {}
  const modules = await knex('Result as r')
    .innerJoin('ResultCategory as rc', 'r.resultCategory1', 'rc.id')
    .where('rc.externalId', 'Error')
    .where('r.deviceId', issue.deviceId)
    .where('r.endedOn', '>=', last30day)
    .whereIn('r.errorCode', MODULE_TEMPERATURE_ERROR_CODES)
    .select(
      'r.moduleSerial as moduleSerial',
      knex.raw('coalesce(min(r.moduleName), r.moduleSerial) as moduleName')
    )
    .count('r.id as errorCount')
    .groupBy('r.moduleSerial')
  const [module] = modules.filter(
    mod => mod.moduleName === issueData.moduleName
  )
  return module != null && module.errorCount <= moduleTemperatureMaxErrors
}

async function resolveMachineTemperatureError(knex, issue) {
  const last30day = subDays(new Date(), 30)
  const machine = await knex('Result as r')
    .innerJoin('ResultCategory as rc', 'r.resultCategory1', 'rc.id')
    .where('rc.externalId', 'Error')
    .where('r.deviceId', issue.deviceId)
    .where('r.endedOn', '>=', last30day)
    .whereIn('r.errorCode', MODULE_TEMPERATURE_ERROR_CODES)
    // TODO .whereNotIn('r.moduleSerial', moduleTemperatureSerials)
    .count('r.id as errorCount')
  return machine != null && machine.errorCount <= machineTemperatureMaxErrors
}

async function resolveModulePowerError(knex, issue) {
  const last30day = subDays(new Date(), 30)
  const issueData = JSON.parse(issue.data) || {}
  const modules = await knex('Result as r')
    .innerJoin('ResultCategory as rc', 'r.resultCategory1', 'rc.id')
    .where('rc.externalId', 'Error')
    .where('r.deviceId', issue.deviceId)
    .where('r.endedOn', '>=', last30day)
    .whereIn('r.errorCode', MODULE_POWER_ERROR_CODES)
    .select(
      'r.moduleSerial as moduleSerial',
      knex.raw('coalesce(min(r.moduleName), r.moduleSerial) as moduleName')
    )
    .count('r.id as errorCount')
    .groupBy('r.moduleSerial')
  const [module] = modules.filter(
    mod => mod.moduleName === issueData.moduleName
  )
  return module != null && module.errorCount <= modulePowerMaxErrors
}

async function resolveMachinePowerError(knex, issue) {
  return false
}

async function resolveModuleProceduralError(knex, issue) {
  return false
}

async function resolveMachineProceduralError(knex, issue) {
  return false
}

async function resolveModuleUnknownError(knex, issue) {
  return false
}

async function resolveMachineUnknownError(knex, issue) {
  return false
}

module.exports = {
  resolveModuleFailureError,
  resolveModuleTemperatureError,
  resolveMachineTemperatureError,
  resolveModulePowerError,
  resolveMachinePowerError,
  resolveModuleProceduralError,
  resolveMachineProceduralError,
  resolveModuleUnknownError,
  resolveMachineUnknownError,
}
