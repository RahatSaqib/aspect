const omit = require('lodash/omit')
const { knex } = require('../../db')
const { getInventoryBySitesAndConsumableQuery } = require('../../inventory/common/db')
const { getConstraints } = require('../../auth/constraints')

async function getInventoryData(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  const inventory = await getInventoryBySitesAndConsumableQuery(
    { query: omit(query, ['minDate', 'maxDate']), auth },
    dataConstraints,
    null,
    [
      't2.siteName',
      't2.consumableName',
      't2.dailyConsumptionRate',
      knex.raw('t2.dailyConsumptionRate * 365 as projectedAnnualConsumption'),
      't2.quantityOnHand',
      't2.daysStockLeft',
      't2.projectedWaste',
    ]
  )
    .whereRaw('t2.quantityOnHand IS NOT NULL')
    .orderBy(['t2.siteName', 't2.consumableName'])

  return inventory
}

module.exports = {
  getInventoryData,
}
