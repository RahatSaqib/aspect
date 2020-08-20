const { knex } = require('../db')
const {
  resultModuleReplaced,
  deviceModuleDisabled,
} = require('../result/actions')

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
  deviceId,
  moduleSerialNumber,
  disabledOn
) {
  const issue = await knex('Issue')
    .where({ deviceId })
    .andWhere(
      knex.raw('"data->>"$.disabledOn"=? and data->>"$.moduleSerialNumber"=?', [
        disabledOn,
        moduleSerialNumber,
      ])
    )
    .orderBy('createdOn', 'desc')
    .first(
      knex.raw(
        "data->>'$.disabledOn' as disabledOn, data->>'$.moduleSerialNumber' moduleSerial"
      )
    )
  if (!issue) {
    if (!messageContext.deviceModuleDisabled) {
      messageContext = messageContext.bindActionCreators({
        deviceModuleDisabled,
      })
    }
    messageContext.deviceModuleDisabled(
      deviceId,
      moduleSerialNumber,
      disabledOn
    )
  }
}

module.exports = {
  getPartnerPluginName,
  getDeviceTypePluginName,
  getReplacedModuleSerials,
  shouldTriggerModuleReplaced,
  shouldTriggerModuleDisabled,
}
