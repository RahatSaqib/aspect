const { knex } = require('../db')
const { getConstraints } = require('../auth/constraints')

const { getInventorySitesQuery } = require('./common/db')
const { SUPPLY_IN_STOCK_FIELDS } = require('./common/querySelectors')

module.exports = async function (request) {
  const { auth } = request
  const dataConstraints = await getConstraints(auth.credentials)

  /*
  // --------
  // old query
  // --------
  const baseWithCalculatedFields =
    getInventoryItemsBySiteGeographyWithCalculatedFieldsBase(
      request,
      dataConstraints
    )
  */
  const baseWithCalculatedFields = getInventorySitesQuery(dataConstraints, request)

  // -----------------
  // group by location fields and consumableId, and return different counts
  const result = await knex
    .from(baseWithCalculatedFields.as('t2'))
    .groupBy('consumableId')
    .select(SUPPLY_IN_STOCK_FIELDS)

  return {
    ok: true,
    total: result.length,
    data: result,
  }
}
