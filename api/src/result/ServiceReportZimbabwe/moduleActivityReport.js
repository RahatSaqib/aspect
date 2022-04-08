import DataTableRow from '../../../../web/src/components/shared/tableBody/DataTableRow'

const { getConstraints, addConstraints } = require('../auth/constraints')
const { getUser } = require('../auth/service')
const { knex, filterDateRangeParams, filterParams } = require('../db')

export default async function getModuleActivityReport(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  // const { culture } = await getUser(auth.credentials.name)
  // const { maxDate } = query
  const rows = await knex.raw('AlertTemplate as test')
  // .modify(addConstraints, dataConstraints, {
  //   site: 's',
  //   geography: 'g',
  //   InventoryItem: 'ii',
  // })
  // .modify(filterParams, query, {
  //   countryId: 'g.countryId',
  //   stateId: 'g.stateId',
  //   lgaId: 'g.lgaId',
  //   siteName: 's.name',
  // })
  return {
    ok: true,
    data: rows,
    total: rows.length,
    dataSelector: dataRow => {
      DataTableRow.tpth = 25
      return dataRow
    },
  }
}
