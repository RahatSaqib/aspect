const { knex, filterParams, sortPageParams } = require('../db')
const { getConstraints } = require('../auth/constraints')

const SELECT_LIST_FIELDS = [
  'c.id',
  'c.name',
  'u.name as unit',
  'u.shortName as unitShortName',
  'c.canExpire',
  'c.manufacturer',
  'c.autoInclude',
]
async function listConsumableTypes(request) {
  const { query, auth } = request

  const dataConstraints = await getConstraints(auth.credentials)

  const consumableQuery = knex('Consumable as c')
    .leftJoin('Unit as u', 'c.unit', 'u.id')
    .leftJoin('Partner as p', 'c.partnerId', 'p.id')
    .whereNull('c.partnerId')
    .orWhere({ 'p.id': dataConstraints.partner.id })
    .modify(filterParams, query, { name: 'c.name' })

  // get total count for paging
  const getCount = consumableQuery
    .clone()
    .count('c.id as count')
    .first()

  // get rows
  const getItems = consumableQuery
    .clone()
    .modify(sortPageParams, query, 'name')
    .select(SELECT_LIST_FIELDS)

  // return result when both queries are finished
  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  const result = { ok: true, total, length: data.length, data }

  return result
}

async function listConsumableReasons(request) {
  const { query } = request

  // TODO: use dataContraints
  const consumableReasonQuery = knex('ConsumableReason as cr').modify(
    filterParams,
    query,
    { name: 'cr.name' }
  )

  // get total count for paging
  const getCount = consumableReasonQuery
    .clone()
    .count('cr.id as count')
    .first()

  // get rows
  const getItems = consumableReasonQuery
    .clone()
    .modify(sortPageParams, query, 'name')
    .select(['id', 'name', 'i18nKey', 'decrease'])

  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  const result = { ok: true, total, length: data.length, data }

  return result
}

function* findConsumables(knownConsumableDetails) {
  return yield knex('Consumable').where(knownConsumableDetails).select()
}

function* findConsumableReasons(knownConsumableReasonDetails) {
  return yield knex('ConsumableReason')
    .where(knownConsumableReasonDetails)
    .select()
}

module.exports = {
  listConsumableTypes,
  listConsumableReasons,
  findConsumables,
  findConsumableReasons,
}
