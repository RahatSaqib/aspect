const Boom = require('@hapi/boom')
const { knex, filterParams, sortPageParams } = require('../db')
const { getConsumableTypes } = require('./common/db')
const { getConstraints, addConstraints } = require('../auth/constraints')

async function listConsumableTypes(request) {
  const { query, auth } = request

  const dataConstraints = await getConstraints(auth.credentials)

  const { getCount, getItems } = await getConsumableTypes(dataConstraints, query)
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
    .select(['id', 'name', 'i18nKey', 'effectOnStock', 'userSelectable', 'externalId'])

  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  const result = { ok: true, total, length: data.length, data }

  return result
}

async function findConsumables(knownConsumableDetails) {
  const consumables = await knex('Consumable').where(knownConsumableDetails).select()
  return consumables
}

function getSiteIdsByConsumable(consumableId, dataConstraints) {
  const consumableSitesQuery = knex('SiteConsumable as sc')
    .leftJoin('Site as s', 's.id', 'sc.siteId')
    .modify(addConstraints, dataConstraints, { site: 's' })
    .where('sc.consumableId', consumableId)
    .pluck('sc.siteId')

  return consumableSitesQuery
}

async function getConsumableDetail(consumableId, dataConstraints) {
  const activeSitesSubQuery = knex('Result as r')
    .leftJoin('Site as s', 's.id', 'r.siteId')
    .leftJoin('ConsumableAssay as ca', 'ca.assayId', 'r.assayId')
    .modify(addConstraints, dataConstraints, { site: 's' })
    .where('ca.consumableId', consumableId)
    .whereNull('r.reconciliationDate')
    .select('r.siteId', 'ca.consumableId')
    .unionAll(function () {
      this.select('ii.siteid', 'ii.consumableId')
        .from('InventoryItem as ii')
        .leftJoin('Site as s', 's.id', 'ii.siteId')
        .modify(addConstraints, dataConstraints, { site: 's' })
        .where('ii.consumableId', consumableId)
        .where('ii.quantityOnHand', '>', 0)
    })

  const consumableQuery = knex('Consumable as c')
    .leftJoin(activeSitesSubQuery.as('activeSites'), 'c.id', 'activeSites.consumableId')
    .first([
      'c.id',
      'c.name',
      'c.i18nKey',
      'c.canExpire',
      'c.manufacturer',
      'c.strategy',
      'c.adjustment',
      'c.unit',
      'c.price',
      'c.includeLocation',
      'c.partNumber',
      knex.raw('GROUP_CONCAT(DISTINCT activeSites.siteId) as activeSites'),
    ])
    .where({ 'c.id': consumableId })
    .groupBy([
      'c.id',
      'c.name',
      'c.i18nKey',
      'c.canExpire',
      'c.manufacturer',
      'c.strategy',
      'c.adjustment',
      'c.unit',
      'c.price',
      'c.includeLocation',
      'c.partNumber',
    ])

  const [consumable, siteIds] = await Promise.all([
    consumableQuery,
    getSiteIdsByConsumable(consumableId, dataConstraints),
  ])

  if (!consumable) {
    return Boom.notFound()
  }

  const selectedSites = consumable.activeSites ? consumable.activeSites.split(',').map(Number) : []
  delete consumable.activeSites

  return consumable
    ? {
        ...consumable,
        siteIds: siteIds || [],
        selectedSites,
      }
    : {}
}

async function getConsumableById(request) {
  const {
    auth,
    params: { consumableId },
  } = request
  const dataConstraints = await getConstraints(auth.credentials)
  const consumable = await getConsumableDetail(consumableId, dataConstraints)
  return consumable
}

async function updateConsumable(request) {
  const {
    params: { consumableId },
    payload: { name, manufacturer, partNumber, price, unit, canExpire, includeLocation, strategy, adjustment },
  } = request

  const updatedValue = knex('Consumable')
    .update({
      id: consumableId,
      name,
      canExpire,
      manufacturer,
      unit,
      strategy,
      adjustment,
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
  getConsumableById,
  getUnits,
  updateConsumable,
}
