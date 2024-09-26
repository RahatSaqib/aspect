const { knex, filterParams, sortPageParams } = require('../db')
const { getConstraints } = require('../auth/constraints')

const SELECT_LIST_FIELDS = [
  'c.id',
  'c.name',
  'c.i18nKey',
  'u.name as unit',
  'u.shortName as unitShortName',
  'c.canExpire',
  'c.manufacturer',
  knex.raw('coalesce(pc.autoInclude, 0) as autoInclude'),
  knex.raw(`CASE WHEN c.strategy IS NOT NULL AND INSTR(c.strategy,'withlot')>0 THEN TRUE ELSE FALSE END AS showLot`),
  knex.raw(
    `CASE WHEN c.strategy IS NOT NULL AND INSTR(c.strategy,'expirationDate')>0 THEN TRUE ELSE FALSE END AS showExpirationDate`
  ),
  knex.raw(
    `coalesce(sum(
        ii.quantityOnHand
      ), 0) as quantityOnHand`
  ),
  knex.raw('COALESCE(COUNT(DISTINCT sc.siteId), 0) as locationTracking'),
]

async function listConsumableTypes(request) {
  const { query, auth } = request

  const dataConstraints = await getConstraints(auth.credentials)

  const consumableQuery = knex('Consumable as c')
    .leftJoin('Unit as u', 'c.unit', 'u.id')
    .leftJoin('InventoryItem as ii', 'ii.consumableId', 'c.id')
    .leftOuterJoin('SiteConsumable as sc', 'c.id', 'sc.consumableId')
    .leftJoin('PartnerConsumable as pc', function () {
      this.on('c.id', 'pc.consumableId').andOn('pc.partnerId', knex.raw(dataConstraints.partner.id))
    })
    .leftJoin('Partner as p', 'pc.partnerId', 'p.id')
    .modify(filterParams, query, { name: 'c.name' })
  // get total count for paging
  const getCount = consumableQuery.clone().countDistinct('c.id as count').first()
  // get rows

  const getItems = consumableQuery
    .clone()
    .modify(sortPageParams, query, 'name')
    .select(SELECT_LIST_FIELDS)
    .groupBy('c.id')

  // return result when both queries are finished
  const [{ count: total }, data] = await Promise.all([getCount, getItems])
  const result = { ok: true, total, length: data.length, data }
  return result
}

async function listConsumableReasons(request) {
  const { query } = request

  // TODO: use dataContraints
  const consumableReasonQuery = knex('ConsumableReason as cr').modify(filterParams, query, { name: 'cr.name' })

  // get total count for paging
  const getCount = consumableReasonQuery.clone().count('cr.id as count').first()

  // get rows
  const getItems = consumableReasonQuery
    .clone()
    .modify(sortPageParams, query, 'name')
    .select(['id', 'name', 'i18nKey', 'decrease', 'reset'])

  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  const result = { ok: true, total, length: data.length, data }

  return result
}

async function findConsumables(knownConsumableDetails) {
  const consumables = await knex('Consumable').where(knownConsumableDetails).select()
  return consumables
}

async function findConsumableReason(consumableReasonName) {
  const consumableReason = await knex('ConsumableReason')
    .where({
      name: consumableReasonName,
    })
    .first()
  return consumableReason
}

function getconsumableSites(consumableId) {
  return knex('SiteConsumable').where('consumableId', consumableId).pluck('siteId')
}

async function getConsumableById(request) {
  const {
    params: { consumableId },
  } = request

  const consumable = await knex('Consumable as c')
    .select([
      'c.id',
      'c.name',
      'c.i18nKey',
      'c.canExpire as trackByExpiration',
      'c.manufacturer',
      'c.unit',
      'c.price',
      'c.includeLocation',
      'c.partNumber',
    ])
    .where({ 'c.id': consumableId })
  const siteIds = await getconsumableSites(consumableId)

  return consumable.length ? { ...consumable[0], siteIds } : {}
}

async function updateConsumable(request) {
  const {
    params: { consumableId },
    payload: { name, manufacturer, partNumber, price, unit, trackByExpirationDate, includeLocation },
  } = request

  const updatedValue = knex('Consumable')
    .update({
      id: consumableId,
      name,
      canExpire: trackByExpirationDate,
      manufacturer,
      unit,
      price,
      includeLocation,
      partNumber,
    })
    .where('id', consumableId)

  return updatedValue
}

async function getUnits() {
  const unit = await knex('Unit as u').select(['u.id', 'u.name', 'u.shortName'])
  return unit
}

module.exports = {
  listConsumableTypes,
  listConsumableReasons,
  findConsumables,
  findConsumableReason,
  getConsumableById,
  getUnits,
  updateConsumable,
}
