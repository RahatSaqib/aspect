const { knex } = require('../db')
const { resultModuleReplaced } = require('../result/actions')
const { deviceModuleDisabled } = require('../device/actions')
const { issueTypeToId, issueStatusToId } = require('../shared/dictionary')

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
  device,
  deviceModule
) {
  /**
   * For checking if this issue was already created, you should check in the Event "onEventTrigger"
   * There the process basically check if there is already an inserted issue or not.
   * This data comes with the dailynews process.
   */
  /* const existingModuleDisabledIssue = await knex('Issue')
    .where({
      issueTypeId,
      deviceId: device.id,
    })
    .andWhere(
      knex.raw(
        'data->>"$.moduleSerial"=? and DATE(data->>"$.disabledOn")=DATE(?)',
        [deviceModule.SiteSerialNumber, deviceModule.Creation]
      )
    )
    .first('data')
*/
  /**
   * If the module wasn't already inserted, we create the issue.
   */

  /**
   * Check if the module was already replaced, after the disabled date.
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
    .andWhere('issueStatusId', '<>', await issueStatusToId('Resolved'))
    .first('data')
  /**
   * If the module wasn't replaced already, we insert the new issue.
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

module.exports = {
  getPartnerPluginName,
  getDeviceTypePluginName,
  getReplacedModuleSerials,
  shouldTriggerModuleReplaced,
  shouldTriggerModuleDisabled,
}
