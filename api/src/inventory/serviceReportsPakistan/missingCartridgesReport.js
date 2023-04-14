const _ = require('lodash')
const { endOfMonth, startOfMonth, subMonths } = require('date-fns')
const { knex } = require('../../db')
const { filterParams, filterDateRangeParams } = require('../../db')
const { addConstraints } = require('../../auth/constraints')

async function getMissingCartridgesReport(dataConstraints, query) {
  const now = new Date()
  const { minDate = startOfMonth(now), maxDate = endOfMonth(now) } = query
  let dateFrom = _.isString(minDate) ? new Date(minDate) : minDate
  const dateTo = _.isString(maxDate) ? new Date(maxDate) : maxDate
  if (dateFrom >= dateTo) {
    dateFrom = subMonths(dateTo, 1)
  }

  const data = await knex('MissingInventoryLots as m')
    .innerJoin('Result as r', 'm.resultId', 'r.id')
    .innerJoin('Site as s', 'm.SiteId', 's.id')
    .innerJoin('Geography as g', 'r.geographyId', 'g.id')
    .innerJoin('State as st', 'g.stateId', 'st.id')
    .innerJoin('Lga as l', 'g.lgaId', 'l.id')
    .innerJoin('ConsumableAssay as ca', 'r.assayId', 'ca.assayId')
    .leftJoin('Site as pa', 's.parentWarehouseId', 'pa.id')
    .modify(addConstraints, dataConstraints, {
      result: 'r',
      geography: 'g',
    })
    .modify(filterDateRangeParams, { minDate: dateFrom, maxDate: dateTo }, 'r.endedOn')
    .modify(filterParams, query, {
      countryId: 'g.countryId',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      siteName: 's.name',
      assayId: 'r.assayId',
      consumableId: 'ca.consumableId',
    })
    .select(
      'r.endedOn',
      's.name as site',
      'st.name as province',
      'l.name as district',
      'm.expirationDate',
      'm.lotNumber',
      'pa.name as warehouse'
    )

  const dataset = {
    ok: true,
    total: data.length,
    length: data.length,
    data,
    fixedColumns: [
      { key: 'endedOn', header: 'Ended On' },
      { key: 'site', header: 'Site' },
      { key: 'province', header: 'Province' },
      { key: 'district', header: 'District' },
      { key: 'expirationDate', header: 'Expiration Date' },
      { key: 'lotNumber', header: 'Lot Number' },
      { key: 'warehouse', header: 'Warehouse' },
    ],
    defaultNoDataMessage: 'No data',
  }
  return dataset
}

module.exports = {
  getMissingCartridgesReport,
}
