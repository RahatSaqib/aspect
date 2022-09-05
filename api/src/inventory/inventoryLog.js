const { getConstraints } = require('../auth/constraints')
const { knex, filterDateRangeParams, filterParams, sortPageParams } = require('../db')
const { getInventoryLogBaseQuery } = require('./common/db')
const { INVENTORY_LOG_LIST, INVENTORY_LOG_SORT_FIELDS } = require('./common/querySelectors')

module.exports = async function (request, response, querySelector = INVENTORY_LOG_LIST) {
  const { auth, query } = request

  const dataConstraints = await getConstraints(auth.credentials)
  const inventoryLogQuery = getInventoryLogBaseQuery(knex, dataConstraints)
    .modify(filterDateRangeParams, query, 'il.createdOn')
    .modify(filterDateRangeParams, query, 'il.expiresOn', 'ExpirationDate')
    .modify(filterParams, query, {
      countryId: 'g.countryId',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      consumableId: 'c.id',
      consumableExternalId: 'c.externalId',
      siteName: 's.name',
      siteId: 's.id',
      lotNumber: 'il.lotNumber',
    })
    .modify(queryBuilder => {
      if (query.onlyTransfers)
        queryBuilder.whereIn('cr.i18nKey', ['ConsumableReason_TransferReceived', 'ConsumableReason_TransferSent'])
    })
  const { total } = await inventoryLogQuery.clone().count('il.id as total').first()

  const data = await inventoryLogQuery
    .select(querySelector)
    .modify(sortPageParams, query, 'il.createdOn', INVENTORY_LOG_SORT_FIELDS)
  return { ok: true, total, length: data.length, data }
}
