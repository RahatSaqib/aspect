const { knex, filterDateRangeParams, filterParams, sortPageParams } = require('../db')
const { addConstraints } = require('../auth/constraints')

const getReconciliationList = async (query, dataConstraints) => {
  const baseQuery = knex('MissingInventoryLots as m')
    .innerJoin('Result as r', 'm.resultId', 'r.id')
    .innerJoin('Site as s', 'm.SiteId', 's.id')
    .innerJoin('Geography as g', 's.geographyId', 'g.id')
    .leftJoin('State as st', 'g.stateId', 'st.id')
    .leftJoin('Lga as l', 'g.lgaId', 'l.id')
    .innerJoin('ConsumableAssay as ca', 'r.assayId', 'ca.assayId')
    .innerJoin('Consumable as c', 'ca.consumableId', 'c.id')
    .leftJoin('Site as pa', 's.parentWarehouseId', 'pa.id')
    .modify(addConstraints, dataConstraints, { result: 'r', geography: 'g' })
    .modify(filterDateRangeParams, query, 'm.expirationDate')
    .modify(filterParams, query, {
      countryId: 'g.countryId',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      siteName: 's.name',
      assayId: 'r.assayId',
      consumableId: 'ca.consumableId',
      lotNumber: 'm.lotNumber',
    })
    .groupBy(['s.id', 'c.id', ...(query.breakOutByLot ? ['m.lotNumber'] : [])])
    .count('* as quantity')
    .select([
      's.name as siteName',
      'c.name as consumableName',
      'st.name as stateName',
      'l.name as lgaName',
      ...(query.breakOutByLot ? ['m.lotNumber'] : []),
      ...(query.breakOutByLot ? ['m.expirationDate as expiresOn'] : []),
    ])

  const getItems = baseQuery.clone().modify(sortPageParams, query, 's.name')

  const getCount = knex.from(baseQuery.clone().as('q')).count('* as total').first()

  return Promise.all([getCount, getItems])
}
module.exports = {
  getReconciliationList,
}
