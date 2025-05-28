const { filterParams, filterDateRangeParams } = require('../db')
const { addConstraints } = require('../auth/constraints')
const { getBaseUnreconciledResultsQuery } = require('./common/db')

async function getUnreconciledInventoryReport(dataConstraints, query) {
  const data = await getBaseUnreconciledResultsQuery()
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
      'r.consumableExpirationDate as expirationDate',
      'r.consumableLot as lotNumber',
      'pa.name as warehouse',
      'c.name as consumableName'
    )
    .orderBy('r.endedOn')

  const dataset = {
    ok: true,
    total: data.length,
    length: data.length,
    data,
    fixedColumns: [
      { key: 'testEndedOn', header: 'Test Ended On' },
      { key: 'site', header: 'Site' },
      { key: 'province', header: 'Province' },
      { key: 'district', header: 'District' },
      { key: 'expirationDate', header: 'Expiration Date' },
      { key: 'lotNumber', header: 'Lot Number' },
      { key: 'warehouse', header: 'Warehouse' },
      { key: 'consumableName', header: 'Consumables' },
    ],
    defaultNoDataMessage: 'No data',
  }
  return dataset
}

module.exports = {
  getUnreconciledInventoryReport,
}
