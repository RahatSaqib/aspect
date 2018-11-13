const _ = require('lodash')
const subDays = require('date-fns/sub_days')
const Promise = require('bluebird')

const {
  MODULE_FAILURE_ERROR_CODES,
  MODULE_POWER_ERROR_CODES,
  MODULE_TEMPERATURE_ERROR_CODES,
  PROCEDURAL_ERROR_CODES,
  REAGENT_HEALTH_ERROR_CODES,
  maxPrcntErrors,
  machineMaxUnknownErrors,
  maxReagentErrorRatio,
  moduleFailureMaxErrors,
  modulePowerMaxErrors,
  moduleMaxUnknownErrors,
  minPrcntMachinePowerResolve,
  moduleTemperatureMaxErrors,
  minPrcntMachineTemperatureResolve,
  minPrcntMachineProceduralResolve,
  minPrcntModuleUnknownErrors,
  minPrcntModuleProceduralResolve,
  minErrorsInvalidsForReagentHealthIssue,
  maxInvalidResultRatio,
  maxInvalidReagentErrorRatio,
  invalidResultBatchRatio,
} = require('./errors')
const {
  getDataCategoryStatus,
  MIN_RESULTS_TO_TRIGGER_DATA_CATEGORY_LOW,
} = require('../../../fact/service')

const { totalWastedInventoryItems } = require('../../../fact/service')
const { getEscalateOrResolveStatusForIssueStockout } = require('./utils')
const { isStockEmpty } = require('../../../shared/mqUtil')

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

async function resolveModuleUnknownError(knex, issue) {
  const last30day = subDays(new Date(), 30)
  const issueData = JSON.parse(issue.data) || {}
  const modules = await knex('Result as r')
    .innerJoin('ResultCategory as rc', 'r.resultCategory1', 'rc.id')
    .where('rc.externalId', 'Error')
    .whereNull('r.errorCode')
    .where('r.deviceId', issue.deviceId)
    .where('r.endedOn', '>=', last30day)
    .select(
      'r.moduleSerial as moduleSerial',
      knex.raw('coalesce(r.moduleName, r.moduleSerial) as moduleName')
    )
    .count('r.id as errorCount')
    .groupBy('r.moduleSerial')

  const [module] = modules.filter(
    mod => mod.moduleName === issueData.moduleName
  )
  if (module == null) {
    return false
  }
  const [{ moduleResultCount }] = await knex('Result as r')
    .where('r.endedOn', '>=', last30day)
    .where('r.moduleSerial', module.moduleSerial)
    .where('r.deviceId', issue.deviceId)
    .count('r.id as moduleResultCount')
  const prcntModuleError = module.errorCount / moduleResultCount * 100
  return (
    prcntModuleError <= maxPrcntErrors ||
    module.errorCount < moduleMaxUnknownErrors
  )
}

async function resolveMachineUnknownError(knex, issue) {
  const last30day = subDays(new Date(), 30)
  const modules = await knex('Result as r')
    .innerJoin('ResultCategory as rc', 'r.resultCategory1', 'rc.id')
    .where('rc.externalId', 'Error')
    .whereNull('r.errorCode')
    .where('r.deviceId', issue.deviceId)
    .where('r.endedOn', '>=', last30day)
    .select(
      'r.moduleSerial as moduleSerial',
      knex.raw('coalesce(r.moduleName, r.moduleSerial) as resultModuleName')
    )
    .count('r.id as errorCount')
    .groupBy('r.moduleSerial')

  // Check for machine issue first
  let allModulesErr = true
  let allModulesTotalErrors = 0
  for (const module of modules) {
    /* eslint-disable no-await-in-loop */
    const [{ moduleResultCount }] = await knex('Result as r')
      .where('r.endedOn', '>=', last30day)
      .where('r.deviceId', issue.deviceId)
      .where('r.moduleSerial', module.moduleSerial)
      .count('r.id as moduleResultCount')
    const prcntModuleError = module.errorCount / moduleResultCount * 100
    allModulesErr =
      allModulesErr && prcntModuleError > minPrcntModuleUnknownErrors
    allModulesTotalErrors += module.errorCount
  }
  return !allModulesErr || allModulesTotalErrors < machineMaxUnknownErrors
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
      knex('ConsumableAssay as ac')
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
      knex('ConsumableAssay as ac')
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

async function resolveDataCategoryLow(knex, issue) {
  // notice that issue.data is [action].options
  const issueData = JSON.parse(issue.data) || {}
  // get needed props from [action].options (see factDataCategoryLow() in /fact/action.js)
  const { siteId, categoryToken } = issueData
  const { plugin } =
    (await knex('Site as s')
      .innerJoin('Partner as p', 's.partnerId', 'p.id')
      .where('s.id', siteId)
      .first('p.plugin')) || {}
  const { loadPlugin } = require('../../../plugin/registration')
  const { dataCategories = [] } = await loadPlugin([plugin], 'dataCategories')
  const dataCategory = _.find(
    dataCategories,
    category => category.externalId === categoryToken
  )

  if (dataCategory) {
    const now = new Date()
    const period = {
      dateFrom: subDays(now, 30),
      dateTo: now,
    }
    const props = { period, siteId, dataCategory }
    const { totals, percentage } = await getDataCategoryStatus(knex, props)

    return (
      totals < MIN_RESULTS_TO_TRIGGER_DATA_CATEGORY_LOW ||
      percentage >= dataCategory.cutoffPercentage
    )
  }
  return false
}

async function resolveIssueStockout(knex, issue) {
  const status = await getEscalateOrResolveStatusForIssueStockout(knex, issue)
  return status.isResolved
}

async function resolveIssueStockExpiring(knex, issue) {
  const isEmptyStock = await isStockEmpty(knex, siteId, consumableId)

  if (isEmptyStock) {
    return true
  }

  // ---------------------------------------
  // see auditInventoryStockExpiring() in /shared/mqUtil.js for triggering issue - here we check opposite
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
  resolveDataCategoryLow,
  resolveReagentHealthError,
  resolveIssueStockout,
  resolveIssueStockExpiring,
}
