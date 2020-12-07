const _ = require('lodash')
const { knex } = require('../db')
const {
  resultModuleReplaced,
  resultAnalyzeErrors,
  resultAnalyzeCategories,
} = require('../result/actions')
const {
  deviceInstrumentReplaced,
  deviceModuleDisabled,
  deviceHardwareError,
} = require('../device/actions')
const { issueTypeToId, allResultCategoryToId } = require('../shared/dictionary')

async function getPartnerPluginName({ partnerId, caseId }) {
  let partnerPluginName = ''
  if (caseId) {
    ;[partnerPluginName] = await knex('PatientCase as c')
      .innerJoin('Partner as p', 'c.partnerId', 'p.id')
      .where('c.id', caseId)
      .select('p.plugin')
      .pluck('p.plugin')
  } else if (partnerId) {
    ;[partnerPluginName] = await knex('Partner')
      .where('id', partnerId)
      .select('plugin')
      .pluck('plugin')
  }
  return partnerPluginName
}

async function getDeviceTypePluginName(deviceId) {
  const [deviceTypePluginName] = await knex('Device as d')
    .leftJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .where('d.id', deviceId || 0)
    .first('dt.plugin')
    .pluck('dt.plugin')
  return deviceTypePluginName
}

async function getReplacedModuleSerials(knex, deviceId) {
  const replacedModuleSerials = knex('Issue as i')
    .join('IssueType as it', 'it.id', 'i.issueTypeId')
    .where('it.externalId', 'ModuleReplaced')
    .where('i.deviceId', deviceId)
    .select(knex.raw('data->>"$.replacedModuleSerial" as replacedModuleSerial'))
    .then(items => items.map(s => s.replacedModuleSerial))

  return replacedModuleSerials
}

async function shouldTriggerResultCategoryAnalysis(
  messageContext,
  deviceId,
  resultId,
  resultCategoryId,
  { resultOutcome, moduleSerial, assayId, consumableLot }
) {
  const resultCategories = await allResultCategoryToId()
  const categoriesToAnalyze = [resultCategories.Invalid]
  if (categoriesToAnalyze.includes(resultCategoryId)) {
    if (!messageContext.resultAnalyzeCategories) {
      messageContext = messageContext.bindActionCreators({
        resultAnalyzeCategories,
      })
    }
    const { resultCategoryExternalId } = await knex('ResultCategory')
      .where({
        id: resultCategoryId,
      })
      .first('externalId as resultCategoryExternalId')
    await messageContext.resultAnalyzeCategories(
      deviceId,
      resultId,
      resultCategoryExternalId,
      {
        moduleSerial,
        resultOutcome,
      }
    )
    await messageContext.resultAnalyzeCategories(
      deviceId,
      resultId,
      resultCategoryExternalId,
      {
        assayId,
        consumableLot,
        resultOutcome,
      }
    )
  }
}

async function shouldTriggerResultErrorAnalysis(
  messageContext,
  deviceId,
  resultId,
  resultErrorCode,
  { resultOutcome, moduleSerial, assayId, consumableLot }
) {
  const errorsToAnalyze = [
    5007,
    5006,
    5016,
    5017,
    5011,
    2005,
    2008,
    2026,
    2032,
    2035,
    2036,
    2096,
    2097,
  ]
  if (errorsToAnalyze.includes(parseInt(resultErrorCode, 10))) {
    if (!messageContext.resultAnalyzeErrors) {
      messageContext = messageContext.bindActionCreators({
        resultAnalyzeErrors,
      })
    }
    await messageContext.resultAnalyzeErrors(
      deviceId,
      resultId,
      resultErrorCode,
      {
        moduleSerial,
        resultOutcome,
      }
    )
    await messageContext.resultAnalyzeErrors(
      deviceId,
      resultId,
      resultErrorCode,
      {
        assayId,
        consumableLot,
        resultOutcome,
      }
    )
  }
}

async function shouldTriggerModuleReplaced(knex, messageContext, resultId) {
  const result = await knex('Result')
    .where('id', resultId)
    .first(
      'id',
      'deviceId',
      'moduleName',
      'moduleSerial',
      'createdOn',
      'endedOn',
      'updatedOn'
    )
  if (!result) {
    return
  }

  if (!messageContext.resultModuleReplaced) {
    messageContext = messageContext.bindActionCreators({
      resultModuleReplaced,
    })
  }

  // get all modules that were replaced so we can ignore them in the queries below:
  const replacedModuleSerials = await getReplacedModuleSerials(
    knex,
    result.deviceId
  )
  // check if a module was just now replaced and trigger replacement-issue if it was
  if (
    result.moduleName &&
    result.moduleSerial &&
    result.createdOn.getTime() === result.updatedOn.getTime()
  ) {
    // get the most recent result from the same moduleName as the current result
    const previousResultOnModule = await knex('Result')
      .where('deviceId', result.deviceId)
      .where('moduleName', result.moduleName)
      .whereNotNull('moduleSerial')
      .whereNot('id', result.id)
      .whereRaw('endedOn < ?', [result.endedOn])
      .orderBy('endedOn', 'desc')
      .first('moduleSerial')
    if (
      previousResultOnModule &&
      previousResultOnModule.moduleSerial !== result.moduleSerial &&
      !replacedModuleSerials.includes(previousResultOnModule.moduleSerial)
    ) {
      messageContext.resultModuleReplaced(result.id, {
        moduleName: result.moduleName,
        replacedModuleSerial: previousResultOnModule.moduleSerial,
        newModuleSerial: result.moduleSerial,
      })
      replacedModuleSerials.push(previousResultOnModule.moduleSerial)
    }
  }
}

async function shouldTriggerModuleDisabled(
  knex,
  messageContext,
  device,
  deviceModule
) {
  /**
   * Check if the module was already replaced
   */
  const moduleReplacedIssue = await knex('Issue')
    .where({
      issueTypeId: await issueTypeToId('ModuleReplaced'),
      deviceId: device.id,
    })
    .andWhere(
      knex.raw(
        'data->>"$.replacedModuleSerial"=? AND DATE(createdOn)>=DATE(?)',
        [deviceModule.SiteSerialNumber, deviceModule.Creation]
      )
    )
    .first('data')
  /**
   * If the module wasn't replaced already, we trigger the event to create the new issue.
   */
  if (!moduleReplacedIssue) {
    if (!messageContext.deviceModuleDisabled) {
      messageContext = messageContext.bindActionCreators({
        deviceModuleDisabled,
      })
    }
    messageContext.deviceModuleDisabled(
      device,
      deviceModule.SiteSerialNumber,
      deviceModule.Creation
    )
  }
}

async function shouldTriggerInstrumentReplaced(knex, messageContext, resultId) {
  const result = await knex('Result as r')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .where('r.id', resultId)
    .first(
      'r.id as resultId',
      'r.moduleName',
      'r.moduleSerial',
      'r.instrumentSerial',
      'r.createdOn',
      'r.endedOn',
      'r.updatedOn',
      // props to populate fields in table 'Issue'
      'r.deviceId',
      'd.partnerId',
      'd.geographyId',
      'd.siteId'
    )
  if (!result) {
    return
  }

  if (!messageContext.deviceInstrumentReplaced) {
    messageContext = messageContext.bindActionCreators({
      deviceInstrumentReplaced,
    })
  }

  // get all instruments that have been already marked as 'replaced'
  // for this device, so we can ignore them in the queries below
  const replacedInstrumentSerials = await knex('Issue as i')
    .innerJoin('IssueType as it', 'it.id', 'i.issueTypeId')
    .where('it.externalId', 'InstrumentReplaced')
    .where('i.deviceId', result.deviceId)
    .select(
      knex.raw(
        'i.data->>"$.replacedInstrumentSerial" as replacedInstrumentSerial'
      )
    )
    .then(items => items.map(x => x.replacedInstrumentSerial))

  // check if instrument was just now replaced and trigger replacement issue.
  if (
    result.instrumentSerial &&
    result.createdOn.getTime() === result.updatedOn.getTime()
  ) {
    // Get the most recent result from the same device and module name as the current result.
    // We have to filter by module name here to account for devices with multiple instruments.
    // We don't want to trigger an instrument replaced issue if the instrument serial comes from
    // another module because it could mean that it's just another instrument that belongs to the same device.
    // Note that this means that we may not trigger an instrument replaced issue immediately
    // when a new result comes in, if the result comes from a different module name than the
    // latest result on that serial, but it will trigger as soon as theres a new result with
    // a different instrument serial on the same module name.
    const previousResultOnInstrument = await knex('Result as r')
      .where('r.deviceId', result.deviceId)
      .where('r.moduleName', result.moduleName)
      .where('r.endedOn', '<', result.endedOn)
      .whereNot('r.id', result.resultId)
      .orderBy('endedOn', 'desc')
      .first('r.instrumentSerial')

    if (
      previousResultOnInstrument &&
      previousResultOnInstrument.instrumentSerial !== result.instrumentSerial &&
      !replacedInstrumentSerials.includes(
        previousResultOnInstrument.instrumentSerial
      )
    ) {
      messageContext.deviceInstrumentReplaced(result, {
        moduleName: result.moduleName,
        replacedInstrumentSerial: previousResultOnInstrument.instrumentSerial,
        newInstrumentSerial: result.instrumentSerial,
      })
    }
  }
}

async function shouldTriggerHardwareErrorAnalysis(contextWithPayload) {
  const {
    knex,
    partnerId,
    device,
    messageContext,
    /**
     * See api/src/deviceApi/service.js - 'payload' is defined in
     * addDeviceDataWithContext(), see there 'operation = {...}' in section 'if (log) {'
     */
    payload: {
      startedOn,
      data: { details = {} },
    },
    /**
     * See api/src/deviceApi/service.js - 'deviceLogUpdate' is defined in
     * DeviceApiContext.parent in addDeviceLogUpdate()
     */
    parent: { deviceLogUpdate: { deviceOperationId } = {} } = {},
  } = contextWithPayload

  if (details.Errors && _.isArray(details.Errors) && details.Errors.length) {
    // get all IssueEventTriggers starting with `Hardware`
    const hardwareEventTriggers = await knex('IssueEventTrigger as iet')
      .innerJoin('IssueType as it', 'iet.issueTypeId', 'it.id')
      .innerJoin('IssueEventStatus as ies', 'iet.issueEventStatusId', 'ies.id')
      .where('ies.externalId', 'Triggered')
      .where('iet.partnerId', partnerId)
      .whereRaw('it.externalId LIKE ?', ['Hardware%'])
      .select(
        'iet.issueTypeId',
        'it.externalId as issueType',
        'iet.triggerConditions as triggerConditionsRaw'
      )
      .then(items =>
        items.map(x => ({
          ...x,
          // append new prop with parsed JSON string
          triggerConditions: JSON.parse(x.triggerConditionsRaw),
        }))
      )

    /**
     * get 1st IssueEventTrigger with needed ErrorCode
     * --> see original details in prop 'triggerConditions' in /seeds/fixtures/IssueEventTrigger.json
     * for 'Hardware*' issueTypes
     */
    const hardwareIssueEventTrigger = _.reduce(
      details.Errors,
      (memo, errorItem) => {
        // get error code from log entry in 'deviceOperation'
        const errorCode = parseInt(errorItem.ErrorCode, 10)
        // get 1st IssueEventTrigger with same error code
        const hardwareIssueEventTrigger = hardwareEventTriggers.find(
          issueEventTrigger => {
            const {
              triggerConditions: {
                conditions: { evaluationFilterParameters = {} },
              } = {},
            } = issueEventTrigger

            return errorCode === evaluationFilterParameters.errorCode
          }
        )

        if (!memo && hardwareIssueEventTrigger) {
          memo = hardwareIssueEventTrigger
        }

        return memo
      },
      null
    )

    if (hardwareIssueEventTrigger) {
      const {
        triggerConditions: {
          conditions: {
            evaluationFilterParameters: { errorCode },
          },
          action: actionType,
        },
      } = hardwareIssueEventTrigger
      const options = {
        startedOn,
        details,
        deviceOperationId,
        errorCode,
      }

      messageContext.dispatch(deviceHardwareError(device, actionType, options))
    }
  }
}

module.exports = {
  getPartnerPluginName,
  getDeviceTypePluginName,
  getReplacedModuleSerials,
  shouldTriggerModuleReplaced,
  shouldTriggerModuleDisabled,
  shouldTriggerInstrumentReplaced,
  shouldTriggerResultErrorAnalysis,
  shouldTriggerResultCategoryAnalysis,
  shouldTriggerHardwareErrorAnalysis,
}
