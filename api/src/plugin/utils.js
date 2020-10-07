const { knex } = require('../db')
const {
  resultModuleReplaced,
  resultAnalyzeErrors,
} = require('../result/actions')
const {
  deviceInstrumentReplaced,
  deviceModuleDisabled,
} = require('../device/actions')
const { issueTypeToId } = require('../shared/dictionary')

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

async function shouldTriggerResultErrorAnalysis(
  messageContext,
  resultId,
  deviceId,
  resultErrorCode,
  { resultOutcome, moduleSerial, assayId, consumableLot }
) {
  const errorsToAnalyze = [5007]
  if (errorsToAnalyze.includes(parseInt(resultErrorCode, 10))) {
    if (!messageContext.resultAnalyzeErrors) {
      messageContext = messageContext.bindActionCreators({
        resultAnalyzeErrors,
      })
    }
    await messageContext.resultAnalyzeErrors(
      resultId,
      deviceId,
      resultErrorCode,
      {
        moduleSerial,
        resultOutcome,
      }
    )
    await messageContext.resultAnalyzeErrors(
      resultId,
      deviceId,
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

module.exports = {
  getPartnerPluginName,
  getDeviceTypePluginName,
  getReplacedModuleSerials,
  shouldTriggerModuleReplaced,
  shouldTriggerModuleDisabled,
  shouldTriggerInstrumentReplaced,
  shouldTriggerResultErrorAnalysis,
}
