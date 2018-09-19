const _ = require('lodash')
const subDays = require('date-fns/sub_days')
const Promise = require('bluebird')

const {
  MODULE_FAILURE_ERROR_CODES,
  MODULE_POWER_ERROR_CODES,
  MODULE_TEMPERATURE_ERROR_CODES,
  PROCEDURAL_ERROR_CODES,
  REAGENT_HEALTH_ERROR_CODES,
  maxReagentErrorRatio,
  moduleFailureMaxErrors,
  modulePowerMaxErrors,
  minPrcntMachinePowerResolve,
  moduleTemperatureMaxErrors,
  minPrcntMachineTemperatureResolve,
  minPrcntMachineProceduralResolve,
  minPrcntModuleProceduralResolve,
  minErrorsInvalidsForReagentHealthIssue,
  maxInvalidResultRatio,
  maxInvalidReagentErrorRatio,
  invalidResultBatchRatio,
} = require('./errors')

const {
  totalDaysUnexpiredInventoryItemsLast,
  totalWastedInventoryItems,
} = require('../../../fact/service')

const { issueStatusToId, issueTypeToId } = require('../../../shared/dictionary')

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
  // TC Not met
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
  if (module != null && module.errorCount <= moduleTemperatureMaxErrors) {
    return true
  }

  // - OR - Machine temperature error active or ack
  const machineTempIssueTypeId = await issueTypeToId('MachineTemperatureError')
  const openIssueStatusIds = await Promise.all([
    issueStatusToId('Active'),
    issueStatusToId('Acknowledged'),
  ])
  const machineTempError = await knex('Issue')
    .where({
      deviceId: issue.deviceId,
      issueTypeId: machineTempIssueTypeId,
    })
    .whereIn('issueStatusId', openIssueStatusIds)
    .first('id')
  return machineTempError != null
}

async function resolveMachineTemperatureError(knex, issue) {
  const last30day = subDays(new Date(), 30)
  const [machine] = await knex('Result as r')
    .innerJoin('ResultCategory as rc', 'r.resultCategory1', 'rc.id')
    .where('rc.externalId', 'Error')
    .where('r.deviceId', issue.deviceId)
    .where('r.endedOn', '>=', last30day)
    .whereIn('r.errorCode', MODULE_TEMPERATURE_ERROR_CODES)
    .count('r.id as errorCount')
  const [total] = await knex('Result as r')
    .where('r.deviceId', issue.deviceId)
    .where('r.endedOn', '>=', last30day)
    .count('r.id as resultCount')
  return (
    machine != null &&
    100 * machine.errorCount / total.resultCount <
      minPrcntMachineTemperatureResolve
  )
}

async function resolveModulePowerError(knex, issue) {
  // TC Not met
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
  if (module != null && module.errorCount <= modulePowerMaxErrors) {
    return true
  }

  // - OR - Machine power error active or ack
  const machinePowerIssueTypeId = await issueTypeToId('MachinePowerError')
  const openIssueStatusIds = await Promise.all([
    issueStatusToId('Active'),
    issueStatusToId('Acknowledged'),
  ])
  const machinePowerError = await knex('Issue')
    .where({
      deviceId: issue.deviceId,
      issueTypeId: machinePowerIssueTypeId,
    })
    .whereIn('issueStatusId', openIssueStatusIds)
    .first('id')
  return machinePowerError != null
}

async function resolveMachinePowerError(knex, issue) {
  const last30day = subDays(new Date(), 30)
  const [machine] = await knex('Result as r')
    .innerJoin('ResultCategory as rc', 'r.resultCategory1', 'rc.id')
    .where('rc.externalId', 'Error')
    .where('r.deviceId', issue.deviceId)
    .where('r.endedOn', '>=', last30day)
    .whereIn('r.errorCode', MODULE_POWER_ERROR_CODES)
    .count('r.id as errorCount')
  const [total] = await knex('Result as r')
    .where('r.deviceId', issue.deviceId)
    .where('r.endedOn', '>=', last30day)
    .count('r.id as resultCount')
  return (
    machine != null &&
    100 * machine.errorCount / total.resultCount < minPrcntMachinePowerResolve
  )
}

async function resolveModuleProceduralError(knex, issue) {
  const { moduleSerial = null } = JSON.parse(issue.data) || {}
  const last30day = subDays(new Date(), 30)
  const [module] = await knex('Result as r')
    .innerJoin('ResultCategory as rc', 'r.resultCategory1', 'rc.id')
    .where('rc.externalId', 'Error')
    .where('r.deviceId', issue.deviceId)
    .where('r.endedOn', '>=', last30day)
    .whereIn('r.errorCode', PROCEDURAL_ERROR_CODES)
    .where('r.moduleSerial', moduleSerial)
    .count('r.id as errorCount')
  const [total] = await knex('Result as r')
    .where('r.deviceId', issue.deviceId)
    .where('r.endedOn', '>=', last30day)
    .where('r.moduleSerial', moduleSerial)
    .count('r.id as resultCount')
  return (
    module != null &&
    100 * module.errorCount / total.resultCount <
      minPrcntModuleProceduralResolve
  )
}

async function resolveMachineProceduralError(knex, issue) {
  const last30day = subDays(new Date(), 30)
  const [machine] = await knex('Result as r')
    .innerJoin('ResultCategory as rc', 'r.resultCategory1', 'rc.id')
    .where('rc.externalId', 'Error')
    .where('r.deviceId', issue.deviceId)
    .where('r.endedOn', '>=', last30day)
    .whereIn('r.errorCode', PROCEDURAL_ERROR_CODES)
    .count('r.id as errorCount')
  const [total] = await knex('Result as r')
    .where('r.deviceId', issue.deviceId)
    .where('r.endedOn', '>=', last30day)
    .count('r.id as resultCount')
  return (
    machine != null &&
    100 * machine.errorCount / total.resultCount <
      minPrcntMachineProceduralResolve
  )
}

async function resolveModuleUnknownError(/* knex, issue */) {
  return false
}

async function resolveMachineUnknownError(/* knex, issue */) {
  return false
}

async function resolveReagentHealthError(knex, { deviceId, consumableId }) {
  const last30day = subDays(new Date(), 30)

  const reagentErrorQuery = knex('Result as r')
    .innerJoin('ResultCategory as rc', 'r.resultCategory1', 'rc.id')
    .where('r.endedOn', '>=', last30day)
    .where({
      'r.deviceId': deviceId,
    })
    .whereIn(
      'r.assayId',
      knex('AssayConsumable as ac')
        .where({ 'ac.consumableId': consumableId })
        .select('ac.assayId')
    )
  const [{ reagentErrorRatio }] = await reagentErrorQuery.clone().select(
    (() => {
      const errorCount =
        "sum(case when r.errorCode in (?) and rc.externalId='Error' then 1 else 0 end)"
      const totalCount = 'count(distinct r.id)'
      return knex.raw(
        `case when count(r.id) = 0 then 0 else ${errorCount} / ${totalCount} * 100 end as reagentErrorRatio`,
        [REAGENT_HEALTH_ERROR_CODES]
      )
    })()
  )
  const [
    { invalidReagentErrorRatio, invalidReagentErrorCount },
  ] = await reagentErrorQuery.clone().select(
    (() => {
      const errorCount =
        "sum(case when (r.errorCode in (?) and rc.externalId='Error') or (rc.externalId='Invalid') then 1 else 0 end)"
      const totalCount = 'count(distinct r.id)'

      return [
        knex.raw(
          `case when count(r.id) = 0 then 0 else ${errorCount} / ${totalCount} * 100 end as invalidReagentErrorRatio`,
          [REAGENT_HEALTH_ERROR_CODES]
        ),
        knex.raw(`${errorCount} as invalidReagentErrorCount`, [
          REAGENT_HEALTH_ERROR_CODES,
        ]),
      ]
    })()
  )
  const invalidResultQuery = knex('Result as r')
    .innerJoin('ResultCategory as rc', 'r.resultCategory1', 'rc.id')
    .where('r.endedOn', '>=', last30day)
    .where({
      'r.deviceId': deviceId,
    })
    .whereIn(
      'r.assayId',
      knex('AssayConsumable as ac')
        .where({ 'ac.consumableId': consumableId })
        .select('ac.assayId')
    )
  const [{ invalidResultRatio }] = await invalidResultQuery.clone().select(
    (() => {
      const invalidCount =
        "sum(case when rc.externalId = 'Invalid' then 1 else 0 end)"
      const totalCount = 'count(distinct r.id)'

      return knex.raw(
        `case when count(r.id) = 0 then 0 else ${invalidCount} / ${totalCount} * 100 end as invalidResultRatio`
      )
    })()
  )
  if (
    (reagentErrorRatio > maxReagentErrorRatio ||
      invalidResultRatio > maxInvalidResultRatio ||
      invalidReagentErrorRatio > maxInvalidReagentErrorRatio) &&
    invalidReagentErrorCount >= minErrorsInvalidsForReagentHealthIssue
  ) {
    return false
  }

  const invalidResultBatchRatios = await invalidResultQuery
    .clone()
    .select(
      (() => {
        const invalidCount =
          "sum(case when rc.externalId = 'Invalid' then 1 else 0 end)"
        const totalCount = 'count(distinct r.id)'

        return knex.raw(
          `r.consumableLot, r.assayId, case when count(r.id) = 0 then 0 else ${invalidCount} / ${totalCount} * 100 end as invalidResultRatio`
        )
      })()
    )
    .groupBy(['r.consumableLot', 'r.assayId'])
  if (
    _.find(
      invalidResultBatchRatios,
      ratio => ratio.invalidResultRatio > invalidResultBatchRatio
    ) != null
  ) {
    return false
  }

  return true
}

async function resolveIssueStockout(knex, issue) {
  // ---------------------------------------
  // see auditInventoryStockout() in /fact/service.js for triggering issue - here we check opposite
  // ---------------------------------------
  const { partnerId, siteId, consumableId } = issue
  const { rate: dailyRate } = (await knex('FactInventoryConsumptionRate')
    .where({ siteId, consumableId, days: 1 })
    .first('rate')) || { rate: 0 }
  // read threshold
  const { dueDaysInventoryStockout: dueDays } = await knex('Partner')
    .where({ id: partnerId })
    .first()

  // use same func as when checking to trigger issue
  const days = await totalDaysUnexpiredInventoryItemsLast({
    knex,
    siteId,
    consumableId,
    dailyRate,
    dueDays,
  })

  // consider issue resolved if number of days to use consumables if greater than threshold
  return days >= dueDays
}

async function resolveIssueStockExpiring(knex, issue) {
  // ---------------------------------------
  // see auditInventoryStockExpiring() in /fact/service.js for triggering issue - here we check opposite
  // ---------------------------------------
  const { siteId, consumableId } = issue
  const { rate: dailyRate } = (await knex('FactInventoryConsumptionRate')
    .where({ siteId, consumableId, days: 1 })
    .first('rate')) || { rate: 0 }

  // use same func as when checking to trigger issue
  const totalWasted = await totalWastedInventoryItems({
    knex,
    siteId,
    consumableId,
    dailyRate,
  })

  // consider issue resolved if totalWasted is 0 (issue is triggering if totalWasted > 0)
  return totalWasted === 0
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
  resolveReagentHealthError,
  resolveIssueStockout,
  resolveIssueStockExpiring,
}
