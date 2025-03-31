const { getConstraints } = require('../auth/constraints')

const { getInventoryLogBaseQuery } = require('./common/db')

module.exports = async function (request) {
  const { auth, query } = request

  const dataConstraints = await getConstraints(auth.credentials)
  const { total, data } = await getInventoryLog(query, dataConstraints)
  return { ok: true, total, length: data.length, data }
}

async function getInventoryLog(requestQuery, dataConstraints, querySelector = INVENTORY_LOG_LIST) {
  if (_.isNil(requestQuery.maxDate)) {
    requestQuery.maxDate = new Date()
  }
  if (_.isNil(requestQuery.minDate)) {
    requestQuery.minDate = subDays(new Date(requestQuery.maxDate), 30).toISOString()
  }

  const inventoryLogQuery = getInventoryLogBaseQuery(knex, dataConstraints)
    .modify(filterDateRangeParams, requestQuery, 'il.createdOn')
    .modify(
      filterDateRangeParams,
      { minDate: requestQuery.minExpirationDate, maxDate: requestQuery.maxExpirationDate },
      'il.expiresOn'
    )
    .modify(filterParams, requestQuery, {
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
      if (requestQuery.onlyTransfers)
        queryBuilder.whereIn('cr.i18nKey', ['ConsumableReason_TransferReceived', 'ConsumableReason_TransferSent'])
    })
    .modify(queryBuilder => {
      if (requestQuery.siteIds) {
        queryBuilder.whereIn('s.id', requestQuery.siteIds.split(','))
      }
    })
  const { total } = await inventoryLogQuery.clone().count('il.id as total').first()

  const data = await inventoryLogQuery
    .select(querySelector)
    .modify(sortPageParams, requestQuery, 'il.createdOn', INVENTORY_LOG_SORT_FIELDS)
  return { data, total }
}