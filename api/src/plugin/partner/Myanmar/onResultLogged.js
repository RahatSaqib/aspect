const _ = require('lodash')
const subDays = require('date-fns/subDays')
const Promise = require('bluebird')

const {
  resultModuleTemperatureError,
  resultModulePowerError,
  resultModuleFailureError,
  resultMachineTemperatureError,
  resultMachineProceduralError,
  resultModuleProceduralError,
  resultMachinePowerError,
  resultModuleUnknownError,
  resultMachineUnknownError,
} = require('../../../result/actions')
const { selectAssayConsumables } = require('../../../consumable/assayConsumableService')
const { inventoryReagentHealth } = require('../../../inventory/actions')
const { resultCategoryToId } = require('../../../shared/dictionary')
const { getReplacedModuleSerials, shouldTriggerModuleReplaced } = require('../../utils')

const {
  MODULE_TEMPERATURE_ERROR_CODES,
  MODULE_POWER_ERROR_CODES,
  MODULE_FAILURE_ERROR_CODES,
  PROCEDURAL_ERROR_CODES,
  REAGENT_HEALTH_ERROR_CODES,
  moduleTemperatureMaxErrors,
  modulePowerMaxErrors,
  moduleFailureMaxErrors,
  machineTemperatureMaxErrors,
  maxPrcntErrors,
  machinePowerMinNoResults,
  machinePowerMinErrorsNoResult,
  maxPrcntMachinePowerErrors,
  maxInvalidResultRatio,
  invalidResultBatchRatio,
  maxReagentErrorRatio,
  maxInvalidReagentErrorRatio,
  minErrorsForLUGenericModuleIssue,
  minErrorsForLUGenericMachineIssue,
  minPrcntModuleUnknownErrors,
  moduleMaxUnknownErrors,
  machineMaxUnknownErrors,
  minErrorsInvalidsForReagentHealthIssue,
} = require('./errors')

// check for error codes when a result is logged
async function onResultLogged({ resultId }, { messageContext }) {
  messageContext = messageContext.bindActionCreators({
    resultModuleTemperatureError,
    resultModulePowerError,
    resultModuleFailureError,
    resultMachineTemperatureError,
    resultMachineProceduralError,
    resultModuleProceduralError,
    resultMachinePowerError,
    inventoryReagentHealth,
    resultModuleUnknownError,
    resultMachineUnknownError,
  })
  await messageContext.run(async knex => {
    const [result] = await knex('Result as r').where('r.id', resultId)
    const { deviceId, siteId, moduleName, moduleSerial, startedOn, instrumentSerial } = result
    const last30day = subDays(new Date(), 30)
    let reagentErrorRatio = 0
    let invalidReagentErrorRatio = 0
    let invalidReagentErrorCount = 0
    // get all modules that were replaced so we can ignore them in the queries below:
    const replacedModuleSerials = await getReplacedModuleSerials(knex, deviceId)

    await shouldTriggerModuleReplaced(
      knex,
      messageContext,
      resultId,
      deviceId,
      moduleSerial,
      instrumentSerial,
      moduleName,
      startedOn
    )

    // prepare query for device results
    const deviceErrorQuery = knex('Result as r')
      .innerJoin('ResultCategory as rc', 'r.resultCategory1', 'rc.id')
      .where('rc.externalId', 'Error')
      .where('r.deviceId', deviceId)

    if (result.errorCode) {
      const moduleErrorSerials = []
      let machineIssueTriggured = false
      if (MODULE_TEMPERATURE_ERROR_CODES.includes(result.errorCode)) {
        const moduleTemperatureSerials = []
        const modules = await deviceErrorQuery
          .clone()
          .where('r.endedOn', '>=', last30day)
          .whereIn('r.errorCode', MODULE_TEMPERATURE_ERROR_CODES)
          .whereNotIn('r.moduleSerial', replacedModuleSerials)
          .select(
            'r.moduleSerial as moduleSerial',
            knex.raw('coalesce(min(r.moduleName), r.moduleSerial) as moduleName')
          )
          .count('r.id as errorCount')
          .groupBy('r.moduleSerial')
        await Promise.all(
          _.map(modules, module => {
            if (module.errorCount > moduleTemperatureMaxErrors) {
              moduleTemperatureSerials.push(module.moduleSerial)
              moduleErrorSerials.push(module.moduleSerial)
              messageContext.resultModuleTemperatureError(deviceId, module)
            }
          })
        )
        // Machine temperature query
        const [{ errorCount }] = await deviceErrorQuery
          .clone()
          .where('r.endedOn', '>=', last30day)
          .whereIn('r.errorCode', MODULE_TEMPERATURE_ERROR_CODES)
          .whereNotIn('r.moduleSerial', replacedModuleSerials)
          .whereNotIn('r.moduleSerial', moduleTemperatureSerials)
          .count('r.id as errorCount')
        if (errorCount > machineTemperatureMaxErrors) {
          machineIssueTriggured = true
          messageContext.resultMachineTemperatureError(deviceId)
        }
      } else if (MODULE_POWER_ERROR_CODES.includes(result.errorCode)) {
        const modules = await deviceErrorQuery
          .clone()
          .where('r.endedOn', '>=', last30day)
          .whereIn('r.errorCode', MODULE_POWER_ERROR_CODES)
          .whereNotIn('r.moduleSerial', replacedModuleSerials)
          .select(
            'r.moduleSerial as moduleSerial',
            knex.raw('coalesce(min(r.moduleName), r.moduleSerial) as moduleName')
          )
          .count('r.id as errorCount')
          .groupBy('r.moduleSerial')
        await Promise.all(
          _.map(modules, module => {
            if (module.errorCount > modulePowerMaxErrors) {
              moduleErrorSerials.push(module.moduleSerial)
              messageContext.resultModulePowerError(deviceId, module)
            }
          })
        )
      } else if (MODULE_FAILURE_ERROR_CODES.includes(result.errorCode)) {
        const modules = await deviceErrorQuery
          .clone()
          .where('r.endedOn', '>=', last30day)
          .whereIn('r.errorCode', MODULE_FAILURE_ERROR_CODES)
          .whereNotIn('r.moduleSerial', replacedModuleSerials)
          .select(
            'r.moduleSerial as moduleSerial',
            knex.raw('coalesce(r.moduleName, r.moduleSerial) as resultModuleName')
          )
          .count('r.id as errorCount')
          .groupBy('r.moduleSerial')
        await Promise.all(
          _.map(modules, module => {
            if (module.errorCount > moduleFailureMaxErrors) {
              moduleErrorSerials.push(module.moduleSerial)
              messageContext.resultModuleFailureError(deviceId, module)
            }
          })
        )
      } else if (PROCEDURAL_ERROR_CODES.includes(result.errorCode) && !machineIssueTriggured) {
        const modules = await deviceErrorQuery
          .clone()
          .where('r.endedOn', '>=', last30day)
          .whereIn('r.errorCode', PROCEDURAL_ERROR_CODES)
          .whereNotIn('r.moduleSerial', replacedModuleSerials)
          .whereNotIn('r.moduleSerial', moduleErrorSerials)
          .select(
            'r.moduleSerial as moduleSerial',
            knex.raw('coalesce(min(r.moduleName), r.moduleSerial) as moduleName')
          )
          .count('r.id as errorCount')
          .groupBy('r.moduleSerial')

        // Check for machine issue first
        let allModulesErr = true
        let allModulesTotalErrors = 0
        await Promise.all(
          _.map(modules, async module => {
            const [{ moduleResultCount }] = await knex('Result as r')
              .where('r.endedOn', '>=', last30day)
              .where('r.moduleSerial', module.moduleSerial)
              .whereNotIn('r.moduleSerial', replacedModuleSerials)
              .count('r.id as moduleResultCount')
            const prcntModuleError = (module.errorCount / moduleResultCount) * 100
            allModulesErr = allModulesErr && prcntModuleError > maxPrcntErrors
            // count errors from all modules
            allModulesTotalErrors += module.errorCount
          })
        )
        if (
          allModulesErr &&
          // LU Generic Machine: Minimum of 8 errors
          allModulesTotalErrors >= minErrorsForLUGenericMachineIssue
        ) {
          // Trigger machine procedural issue
          messageContext.resultMachineProceduralError(deviceId)
        } else {
          // Check for module procedural issue
          await Promise.all(
            _.map(modules, async module => {
              const [{ moduleResultCount }] = await knex('Result as r')
                .where('r.endedOn', '>=', last30day)
                .where('r.moduleSerial', module.moduleSerial)
                .whereNotIn('r.moduleSerial', replacedModuleSerials)
                .count('r.id as moduleResultCount')
              const prcntModuleError = (module.errorCount / moduleResultCount) * 100
              if (
                prcntModuleError > maxPrcntErrors &&
                // LU Generic Module: Minimum of 6 errors
                module.errorCount >= minErrorsForLUGenericModuleIssue
              ) {
                messageContext.resultModuleProceduralError(deviceId, module)
              }
            })
          )
        }
      } else if (REAGENT_HEALTH_ERROR_CODES.includes(result.errorCode)) {
        const reagentErrorQuery = knex('Result as r')
          .innerJoin('ResultCategory as rc', 'r.resultCategory1', 'rc.id')
          .where('r.endedOn', '>=', last30day)
          .whereNotIn('r.moduleSerial', replacedModuleSerials)
          .where({
            'r.siteId': siteId,
          })
        ;[{ reagentErrorRatio }] = await reagentErrorQuery.clone().select(
          (() => {
            const errorCount = "sum(case when r.errorCode in (?) and rc.externalId='Error' then 1 else 0 end)"
            const totalCount = 'count(distinct r.id)'

            return knex.raw(
              `case when count(r.id) = 0 then 0 else ${errorCount} / ${totalCount} * 100 end as reagentErrorRatio`,
              [REAGENT_HEALTH_ERROR_CODES]
            )
          })()
        )
        ;[{ invalidReagentErrorRatio, invalidReagentErrorCount }] = await reagentErrorQuery.clone().select(
          (() => {
            const errorCount =
              "sum(case when (r.errorCode in (?) and rc.externalId='Error') or (rc.externalId='Invalid') then 1 else 0 end)"
            const totalCount = 'count(distinct r.id)'

            return [
              knex.raw(
                `case when count(r.id) = 0 then 0 else ${errorCount} / ${totalCount} * 100 end as invalidReagentErrorRatio`,
                [REAGENT_HEALTH_ERROR_CODES]
              ),
              knex.raw(`${errorCount} as invalidReagentErrorCount`, [REAGENT_HEALTH_ERROR_CODES]),
            ]
          })()
        )
      }
    } else {
      // -----------
      // here we know that errorCode is not specified, so
      // next - check if result is actual Error
      // -----------
      // read result category
      const resultCategory = await knex('ResultCategory as rc')
        .where({ id: result.resultCategory1 })
        .first('id', 'externalId')

      // result is actual Error
      if (resultCategory.externalId === 'Error') {
        const totalResults = {}
        // check how many such cases occured during last 30 days for each module...
        const modules = await deviceErrorQuery
          .clone()
          .where('r.endedOn', '>=', last30day)
          .whereNotIn('r.moduleSerial', replacedModuleSerials)
          .whereNull('r.errorCode') // must be null
          .select(
            'r.moduleSerial as moduleSerial',
            knex.raw('coalesce(min(r.moduleName), r.moduleSerial) as moduleName')
          )
          .count('r.id as errorCount')
          .groupBy('r.moduleSerial')
        // Check for machine issue first
        let allModulesErr = true
        let allModulesTotalErrors = 0
        await Promise.all(
          _.map(modules, async module => {
            const [{ moduleResultCount }] = await knex('Result as r')
              .where('r.deviceId', deviceId)
              .where('r.endedOn', '>=', last30day)
              .where('r.moduleSerial', module.moduleSerial)
              .count('r.id as moduleResultCount')
            const prcntModuleError = (module.errorCount / moduleResultCount) * 100
            allModulesErr = allModulesErr && prcntModuleError > minPrcntModuleUnknownErrors
            totalResults[module.moduleSerial] = moduleResultCount
            allModulesTotalErrors += module.errorCount
          })
        )

        if (
          allModulesErr &&
          // LU Machine Unknown Error: Minimum of 8 errors
          allModulesTotalErrors >= machineMaxUnknownErrors
        ) {
          // Trigger machine UnknownError issue
          messageContext.resultMachineUnknownError(deviceId)
        } else {
          // Check for module issue
          await Promise.each(modules, async module => {
            const moduleResultCount = totalResults[module.moduleSerial]
            const prcntModuleError = (module.errorCount / moduleResultCount) * 100
            if (
              prcntModuleError > maxPrcntErrors &&
              // LU Module Unknown Error: Minimum of 6 errors
              module.errorCount >= moduleMaxUnknownErrors
            ) {
              return messageContext.resultModuleUnknownError(deviceId, module)
            }
          })
        }
      }
    }

    // Check for machine power issue triggered by noResult or power errors
    const [{ noResultCount }] = await knex('Result as r')
      .innerJoin('ResultCategory as rc', 'r.resultCategory1', 'rc.id')
      .where('r.deviceId', deviceId)
      .where('r.endedOn', '>=', last30day)
      .where('rc.externalId', 'NoResult')
      .whereNotIn('r.moduleSerial', replacedModuleSerials)
      .count('r.id as noResultCount')

    const [{ powerErrorCount }] = await knex('Result as r')
      .where('r.deviceId', deviceId)
      .where('r.endedOn', '>=', last30day)
      .whereIn('r.errorCode', MODULE_POWER_ERROR_CODES)
      .whereNotIn('r.moduleSerial', replacedModuleSerials)
      .count('r.id as powerErrorCount')

    const [{ machineResultCount }] = await knex('Result as r')
      .where('r.deviceId', deviceId)
      .where('r.endedOn', '>=', last30day)
      .count('r.id as machineResultCount')

    if (machineResultCount !== 0) {
      const prcntNoResult = (noResultCount / machineResultCount) * 100
      if (
        (prcntNoResult > maxPrcntMachinePowerErrors && noResultCount >= machinePowerMinNoResults) ||
        noResultCount + powerErrorCount > machinePowerMinErrorsNoResult
      ) {
        messageContext.resultMachinePowerError(deviceId)
      }
    }

    const resultCategoryInvalidId = await resultCategoryToId('Invalid')
    let invalidResultRatio = 0
    if (result.resultCategory1 === resultCategoryInvalidId) {
      const invalidResultQuery = knex('Result as r')
        .innerJoin('ResultCategory as rc', 'r.resultCategory1', 'rc.id')
        .where('r.endedOn', '>=', last30day)
        .where({
          'r.siteId': result.siteId,
        })
      ;[{ invalidResultRatio }] = await invalidResultQuery.clone().select(
        (() => {
          const invalidCount = "sum(case when rc.externalId = 'Invalid' then 1 else 0 end)"
          const totalCount = 'count(distinct r.id)'

          return knex.raw(
            `case when count(r.id) = 0 then 0 else ${invalidCount} / ${totalCount} * 100 end as invalidResultRatio`
          )
        })()
      )
      const invalidResultBatchRatios = await invalidResultQuery
        .clone()
        .select(
          (() => {
            const invalidCount = "sum(case when rc.externalId = 'Invalid' then 1 else 0 end)"
            const totalCount = 'count(distinct r.id)'

            return knex.raw(
              `r.consumableLot, r.assayId, case when count(r.id) = 0 then 0 else ${invalidCount} / ${totalCount} * 100 end as invalidResultRatio`
            )
          })()
        )
        .groupBy(['r.consumableLot', 'r.assayId'])

      await Promise.each(invalidResultBatchRatios, async ratio => {
        if (ratio.invalidResultRatio > invalidResultBatchRatio) {
          await createInventoryReagentHealthIssue(
            knex,
            result.deviceId,
            result.partnerId,
            result.assayId,
            messageContext.inventoryReagentHealth
          )
        }
      })
    }
    if (
      (reagentErrorRatio > maxReagentErrorRatio ||
        invalidResultRatio > maxInvalidResultRatio ||
        invalidReagentErrorRatio > maxInvalidReagentErrorRatio) &&
      invalidReagentErrorCount >= minErrorsInvalidsForReagentHealthIssue
    ) {
      await createInventoryReagentHealthIssue(
        knex,
        result.deviceId,
        result.partnerId,
        result.assayId,
        messageContext.inventoryReagentHealth
      )
    }
  })
}

async function createInventoryReagentHealthIssue(knex, deviceId, partnerId, assayId, dispatchAction) {
  const assayConsumables = await selectAssayConsumables(knex, { partner: { id: partnerId } }, assayId)
  await Promise.each(assayConsumables, async ({ consumableId }) => dispatchAction(deviceId, consumableId))
}

module.exports = onResultLogged
