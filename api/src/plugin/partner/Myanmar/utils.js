const {
  totalDaysUnexpiredInventoryItemsLast,
} = require('../../../fact/service')

async function getEscalateOrResolveStatusForIssueStockout(knex, issue) {
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
  return {
    level: days < 14 ? 2 : days < dueDays ? 1 : undefined,
    isEscalated: days < 14, // escalate issue if number of days to use consumables is less than 14
    isResolved: days >= dueDays, // consider issue resolved if number of days to use consumables if greater than threshold
  }
}

async function getReplacedModuleSerials(knex, deviceId) {
  const replacedModuleSerials = knex('Issue as i')
    .join('IssueType as it', 'it.id', 'i.issueTypeId')
    .where('it.externalId', 'ModuleReplaced')
    .where('i.deviceId', deviceId)
    .select(knex.raw('data->>"$.replacedModuleSerial" as replacedModuleSerial'))
    .map(s => s.replacedModuleSerial)

  return replacedModuleSerials
}

module.exports = {
  getEscalateOrResolveStatusForIssueStockout,
  getReplacedModuleSerials,
}
