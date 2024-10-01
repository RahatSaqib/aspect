const { knex, filterDateRangeParams, query, filterParams, sortPageParams } = require('../db')
const { addConstraints } = require('../auth/constraints')

function getReconciliationList(query, dataConstraints) {
  return knex('MissingInventoryLots as m')
    .innerJoin('Result as r', 'm.resultId', 'r.id')
    .innerJoin('Site as s', 'm.SiteId', 's.id')
    .innerJoin('Geography as g', 's.geographyId', 'g.id')
    .leftJoin('State as st', 'g.stateId', 'st.id')
    .leftJoin('Lga as l', 'g.lgaId', 'l.id')
    .innerJoin('ConsumableAssay as ca', 'r.assayId', 'ca.assayId')
    .innerJoin('Consumable as c', 'ca.consumableId', 'c.id')
    .leftJoin('Site as pa', 's.parentWarehouseId', 'pa.id')
    .modify(addConstraints, dataConstraints, {
      result: 'r',
      geography: 'g',
    })
    .modify(filterDateRangeParams, query, 'r.endedOn')
    .modify(filterParams, query, {
      countryId: 'g.countryId',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      siteName: 's.name',
      assayId: 'r.assayId',
      consumableId: 'ca.consumableId',
    })
    .select(
      'r.endedOn as testEndedOn',
      's.name as site',
      'st.name as province',
      'l.name as district',
      query.breakOutByLot ? 'm.expirationDate' : knex.raw('MAX(m.expirationDate) as expirationDate'),
      query.breakOutByLot ? 'm.lotNumber' : knex.raw('GROUP_CONCAT(DISTINCT m.lotNumber) as lotNumbers'),
      'pa.name as warehouse',
      'c.name as consumableName',
      query.breakOutByLot ? knex.raw('COUNT(*) as lotCount') : knex.raw('COUNT(DISTINCT m.id) as totalConsumableCount') // Corrected count logic
    )
    .groupBy('r.endedOn', 's.name', 'st.name', 'l.name', 'pa.name', 'c.name')
    .modify(qb => {
      if (query.breakOutByLot) {
        qb.groupBy('m.lotNumber', 'm.siteId') // Group by stateId (st.id) and lotNumber
      }
    })
    .orderBy('r.endedOn')
}

module.exports = {
  getReconciliationList,
}
