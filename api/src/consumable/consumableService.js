const { knex, filterParams, sortPageParams } = require('../db')
const { getConsumableTypes } = require('./common/db')
const { getConstraints } = require('../auth/constraints')

async function listConsumableTypes(request) {
  const { query, auth } = request

  const dataConstraints = await getConstraints(auth.credentials)

  const { getCount, getItems } = getConsumableTypes(dataConstraints, query)
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

function getConsumableSites(consumableId) {
  return knex('SiteConsumable').where('consumableId', consumableId).pluck('siteId')
}

async function getConsumableDetail(consumableId) {
  const consumableQuery = knex('Consumable as c')
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
  const [consumable, siteIds] = await Promise.all([consumableQuery, getConsumableSites(consumableId)])

  return consumable.length ? { ...consumable[0], siteIds } : {}
}

async function getConsumableById(request) {
  const {
    params: { consumableId },
  } = request
  const consumable = await getConsumableDetail(consumableId)
  return consumable
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
