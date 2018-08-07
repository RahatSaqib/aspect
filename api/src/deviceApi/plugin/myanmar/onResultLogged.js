const _ = require('lodash')
const subDays = require('date-fns/sub_days')

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
const {
  selectAssayConsumables,
} = require('../../../consumable/assayConsumableService')
const { inventoryReagentHealth } = require('../../../inventory/actions')
const { resultCategoryToId } = require('../../../shared/dictionary')

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
const maxPrcntErrors = 5
const machinePowerMaxErrors = 8
const machinePowerMinNoResults = 8
const maxPrcntMachinePowerErrors = 3
const maxInvalidResultRatio = 3
const invalidResultBatchRatio = 2
const maxReagentErrorRatio = 3
const maxInvalidReagentErrorRatio = 4
const minErrorsForLUGenericModuleIssue = 6
const minErrorsForLUGenericMachineIssue = 8

const minPrcntModuleUnknownErrors = 5
const moduleMaxUnknownErrors = 6
const machineMaxUnknownErrors = 8
const minErrorsInvalidsForReagentHealthIssue = 8

// check for error codes when a result is logged
async function onResultLogged({ resultId }, { messageContext }) {
  const context = messageContext.bindActionCreators({
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
  await context.run(async knex => {
    const [result] = await knex('Result as r').where('r.id', resultId)
    const { deviceId, siteId } = result
    const last30day = subDays(new Date(), 30)
    let reagentErrorRatio = 0
    let invalidReagentErrorRatio = 0
    let invalidReagentErrorCount = 0

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
          .select(
            'r.moduleSerial as moduleSerial',
            knex.raw(
              'coalesce(min(r.moduleName), r.moduleSerial) as moduleName'
            )
          )
          .count('r.id as errorCount')
          .groupBy('r.moduleSerial')
        await Promise.all(
          _.map(modules, module => {
            if (module.errorCount > moduleTemperatureMaxErrors) {
              moduleTemperatureSerials.push(module.moduleSerial)
              moduleErrorSerials.push(module.moduleSerial)
              context.resultModuleTemperatureError(deviceId, module)
            }
          })
        )
        // Machine temperature query
        const [{ errorCount }] = await deviceErrorQuery
          .clone()
          .where('r.endedOn', '>=', last30day)
          .whereIn('r.errorCode', MODULE_TEMPERATURE_ERROR_CODES)
          .whereNotIn('r.moduleSerial', moduleTemperatureSerials)
          .count('r.id as errorCount')
        if (errorCount > machineTemperatureMaxErrors) {
          machineIssueTriggured = true
          context.resultMachineTemperatureError(deviceId)
        }
      } else if (MODULE_POWER_ERROR_CODES.includes(result.errorCode)) {
        const modules = await deviceErrorQuery
          .clone()
          .where('r.endedOn', '>=', last30day)
          .whereIn('r.errorCode', MODULE_POWER_ERROR_CODES)
          .select(
            'r.moduleSerial as moduleSerial',
            knex.raw(
              'coalesce(min(r.moduleName), r.moduleSerial) as moduleName'
            )
          )
          .count('r.id as errorCount')
          .groupBy('r.moduleSerial')
        await Promise.all(
          _.map(modules, module => {
            if (module.errorCount > modulePowerMaxErrors) {
              moduleErrorSerials.push(module.moduleSerial)
              context.resultModulePowerError(deviceId, module)
            }
          })
        )
        const [{ errorCount }] = await deviceErrorQuery
          .clone()
          .where('r.endedOn', '>=', last30day)
          .whereIn('r.errorCode', MODULE_POWER_ERROR_CODES)
          .count('r.id as errorCount')
        if (errorCount > machinePowerMaxErrors) {
          context.resultMachinePowerError(deviceId)
        }
      } else if (MODULE_FAILURE_ERROR_CODES.includes(result.errorCode)) {
        const modules = await deviceErrorQuery
          .clone()
          .where('r.endedOn', '>=', last30day)
          .whereIn('r.errorCode', MODULE_FAILURE_ERROR_CODES)
          .select(
            'r.moduleSerial as moduleSerial',
            knex.raw(
              'coalesce(r.moduleName, r.moduleSerial) as resultModuleName'
            )
          )
          .count('r.id as errorCount')
          .groupBy('r.moduleSerial')
        await Promise.all(
          _.map(modules, module => {
            if (module.errorCount > moduleFailureMaxErrors) {
              moduleErrorSerials.push(module.moduleSerial)
              context.resultModuleFailureError(deviceId, module)
            }
          })
        )
      } else if (
        PROCEDURAL_ERROR_CODES.includes(result.errorCode) &&
        !machineIssueTriggured
      ) {
        const modules = await deviceErrorQuery
          .clone()
          .where('r.endedOn', '>=', last30day)
          .whereIn('r.errorCode', PROCEDURAL_ERROR_CODES)
          .whereNotIn('r.moduleSerial', moduleErrorSerials)
          .select(
            'r.moduleSerial as moduleSerial',
            knex.raw(
              'coalesce(min(r.moduleName), r.moduleSerial) as moduleName'
            )
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
              .count('r.id as moduleResultCount')
            const prcntModuleError = module.errorCount / moduleResultCount * 100
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
          context.resultMachineProceduralError(deviceId)
        } else {
          // Check for module procedural issue
          _.map(modules, async module => {
            const [{ moduleResultCount }] = await knex('Result as r')
              .where('r.endedOn', '>=', last30day)
              .where('r.moduleSerial', module.moduleSerial)
              .count('r.id as moduleResultCount')
            const prcntModuleError = module.errorCount / moduleResultCount * 100
            if (
              prcntModuleError > maxPrcntErrors &&
              // LU Generic Module: Minimum of 6 errors
              module.errorCount >= minErrorsForLUGenericModuleIssue
            ) {
              context.resultModuleProceduralError(deviceId, module)
            }
          })
        }
      } else if (REAGENT_HEALTH_ERROR_CODES.includes(result.errorCode)) {
        const reagentErrorQuery = knex('Result as r')
          .innerJoin('ResultCategory as rc', 'r.resultCategory1', 'rc.id')
          .where({
            'r.siteId': siteId,
          })
        ;[{ reagentErrorRatio }] = await reagentErrorQuery.clone().select(
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
        ;[
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
          .whereNull('r.errorCode') // must be null
          .select(
            'r.moduleSerial as moduleSerial',
            knex.raw(
              'coalesce(min(r.moduleName), r.moduleSerial) as moduleName'
            )
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
              .count('r.id as moduleResultCount')
            const prcntModuleError = module.errorCount / moduleResultCount * 100
            allModulesErr =
              allModulesErr && prcntModuleError > minPrcntModuleUnknownErrors
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
          context.resultMachineUnknownError(deviceId)
        } else {
          // Check for module issue
          _.map(modules, async module => {
            const moduleResultCount = totalResults[module.moduleSerial]
            const prcntModuleError = module.errorCount / moduleResultCount * 100
            if (
              prcntModuleError > maxPrcntErrors &&
              // LU Module Unknown Error: Minimum of 6 errors
              module.errorCount >= moduleMaxUnknownErrors
            ) {
              context.resultModuleUnknownError(deviceId, module)
            }
          })
        }
      }
    }

    // Check for machine power issue triggered by noResult
    const [{ noResultCount }] = await knex('Result as r')
      .innerJoin('ResultCategory as rc', 'r.resultCategory1', 'rc.id')
      .where('r.deviceId', deviceId)
      .where('r.endedOn', '>=', last30day)
      .where('rc.externalId', 'NoResult')
      .count('r.id as noResultCount')

    const [{ machineResultCount }] = await knex('Result as r')
      .where('r.deviceId', deviceId)
      .where('r.endedOn', '>=', last30day)
      .count('r.id as machineResultCount')

    if (machineResultCount !== 0) {
      const prcntNoResult = noResultCount / machineResultCount * 100
      if (
        prcntNoResult > maxPrcntMachinePowerErrors &&
        // LU Machine Power: minimum of 8 "No Results"
        noResultCount >= machinePowerMinNoResults
      ) {
        context.resultMachinePowerError(deviceId)
      }
    }

    const resultCategoryInvalidId = await resultCategoryToId('Invalid')
    let invalidResultRatio = 0
    if (result.resultCategory1 === resultCategoryInvalidId) {
      const invalidResultQuery = knex('Result as r')
        .innerJoin('ResultCategory as rc', 'r.resultCategory1', 'rc.id')
        .where({
          'r.siteId': result.siteId,
        })
      ;[{ invalidResultRatio }] = await invalidResultQuery.clone().select(
        (() => {
          const invalidCount =
            "sum(case when rc.externalId = 'Invalid' then 1 else 0 end)"
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
            const invalidCount =
              "sum(case when rc.externalId = 'Invalid' then 1 else 0 end)"
            const totalCount = 'count(distinct r.id)'

            return knex.raw(
              `r.consumableLot, r.assayId, case when count(r.id) = 0 then 0 else ${invalidCount} / ${totalCount} * 100 end as invalidResultRatio`
            )
          })()
        )
        .groupBy(['r.consumableLot', 'r.assayId'])
      _.forEach(invalidResultBatchRatios, ratio => {
        if (ratio.invalidResultRatio > invalidResultBatchRatio) {
          createInventoryReagentHealthIssue(
            knex,
            result.deviceId,
            result.partnerId,
            result.assayId,
            context.inventoryReagentHealth
          )
        }
      })
    }
    if (
      (reagentErrorRatio > maxReagentErrorRatio ||
        invalidResultRatio > maxInvalidResultRatio ||
        invalidReagentErrorRatio > maxInvalidReagentErrorRatio) &&
      invalidReagentErrorCount > minErrorsInvalidsForReagentHealthIssue
    ) {
      createInventoryReagentHealthIssue(
        knex,
        result.deviceId,
        result.partnerId,
        result.assayId,
        context.inventoryReagentHealth
      )
    }
  })
}

async function createInventoryReagentHealthIssue(
  knex,
  deviceId,
  partnerId,
  assayId,
  dispatchAction
) {
  const assayConsumables = await selectAssayConsumables(
    knex,
    partnerId,
    assayId
  )
  _.map(assayConsumables, async assayConsumable => {
    dispatchAction(deviceId, assayConsumable.consumableId)
  })
}

module.exports = onResultLogged
