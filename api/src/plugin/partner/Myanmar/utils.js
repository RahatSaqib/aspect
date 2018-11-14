const {
  totalDaysUnexpiredInventoryItemsLast,
  isStockEmpty,
} = require('../../../shared/utilsInventory')

async function getEscalateOrResolveStatusForIssueStockout(knex, issue) {
  const { partnerId, siteId, consumableId } = issue

  const isEmptyStock = await isStockEmpty(knex, siteId, consumableId)
  if (isEmptyStock) {
    // if stock is empty then keep issue unchanged
    return {
      // level: 1,
      isEscalated: false,
      isResolved: false,
    }
  }

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

module.exports = {
  getEscalateOrResolveStatusForIssueStockout,
}
