const uuid = require('node-uuid')
const Boom = require('@hapi/boom')
const { knex, filterParams, filterDateRangeParams, sortPageParams } = require('../../db')
const { addConstraints } = require('../../auth/constraints')
const { INTERNAL_DEVICE_IDS } = require('../../shared/constants')
const { SELECT_LIST_FIELDS } = require('./constants')
const { getNotDecommissionedDevices } = require('../../device/common/db')

function getSitesQuery(dataConstraints) {
  return knex('Site as s')
    .join('SiteType as st', 's.siteTypeId', 'st.id')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .leftOuterJoin('State as sta', 'g.stateId', 'sta.id')
    .leftOuterJoin('Lga as l', 'g.lgaId', 'l.id')
    .leftOuterJoin('InventoryItem as ii', 's.id', 'ii.siteId')
    .leftOuterJoin('SiteConsumable as sc', 's.id', 'sc.siteId')
    .leftOuterJoin('Site as spw', 's.parentWarehouseId', 'spw.id')
    .whereNotIn('s.externalId', INTERNAL_DEVICE_IDS)
    .groupBy(['s.id'])
    .modify(addConstraints, dataConstraints, { site: 's', geography: 'g' })
}

const getExistingSite = async (name, shortName, externalId) =>
  getExistingSiteExcludingCurrent(null, name, shortName, externalId)

async function getExistingSiteExcludingCurrent(siteId, name, shortName, externalId) {
  return knex('Site')
    .whereNot({ id: siteId })
    .whereNot({ disabled: 1 })
    .where(qb => qb.orWhere({ name }).orWhere({ shortName }).orWhere({ externalId }))
    .first('name', 'shortName', 'externalId')
}

async function updateSite(siteId, params) {
  await knex('Site as s').where('s.id', siteId).update(params)
}

async function updateSiteConsumable(knex, siteId, { modify, consumableId }) {
  if (modify === 'add') {
    return knex('SiteConsumable')
      .insert({
        siteId,
        consumableId,
      })
      .onConflict(['siteId', 'consumableId'])
      .ignore()
  }
  const exists = await knex('InventoryItem').where({ siteId, consumableId }).first()
  if (exists) {
    throw Boom.conflict('Unable to remove the cartridge')
  } else {
    return knex('SiteConsumable').where({ siteId, consumableId }).del()
  }
}

async function updateSiteConsumablesBatch(knex, siteId, { consumableIds }) {
  // Get current consumables for this site
  const currentConsumables = await knex('SiteConsumable')
    .where({ siteId })
    .select('consumableId')
    .then(rows => rows.map(row => row.consumableId))

  // Find consumables to add and remove
  const consumablesToAdd = consumableIds.filter(id => !currentConsumables.includes(id))
  const consumablesToRemove = currentConsumables.filter(id => !consumableIds.includes(id))

  // Check if any consumables to remove have inventory or unreconciled transactions
  if (consumablesToRemove.length > 0) {
    const hasInventory = await knex('InventoryItem')
      .where({ siteId })
      .whereIn('consumableId', consumablesToRemove)
      .where('quantityOnHand', '>', 0)
      .first()

    if (hasInventory) {
      throw Boom.conflict('Unable to remove consumables with existing inventory')
    }

    // Check for unreconciled results
    const hasUnreconciledResults = await knex('Result as r')
      .leftJoin('ConsumableAssay as ca', 'ca.assayId', 'r.assayId')
      .where('r.siteId', siteId)
      .whereIn('ca.consumableId', consumablesToRemove)
      .whereNull('r.reconciliationDate')
      .first()

    if (hasUnreconciledResults) {
      throw Boom.conflict('Unable to remove consumables with unreconciled transactions')
    }
  }

  // Perform atomic batch operation
  return knex.transaction(async trx => {
    // Remove consumables that are no longer selected
    if (consumablesToRemove.length > 0) {
      await trx('SiteConsumable').where({ siteId }).whereIn('consumableId', consumablesToRemove).del()
    }

    // Add new consumables
    if (consumablesToAdd.length > 0) {
      const rowsToInsert = consumablesToAdd.map(consumableId => ({
        siteId,
        consumableId,
      }))
      await trx('SiteConsumable').insert(rowsToInsert).onConflict(['siteId', 'consumableId']).ignore()
    }
  })
}

async function checkSiteAccess(siteId, dataConstraints) {
  return knex('Site as s').where('s.id', siteId).modify(addConstraints, dataConstraints, { site: 's' }).first('s.id')
}

async function checkSitesAccess(siteIds, dataConstraints) {
  const accessibleSites = await knex('Site as s')
    .whereIn('s.id', siteIds)
    .modify(addConstraints, dataConstraints, { site: 's' })
    .select('s.id')

  return accessibleSites.length
}

const getSiteIdByName = async siteName => {
  const site = await knex('Site').where('name', siteName).first('id')
  return site ? site.id : null
}

const insertSiteConsumables = async (siteId, consumableIds) => {
  if (!consumableIds || consumableIds.length === 0) return

  const rows = consumableIds.map(consumableId => ({
    siteId,
    consumableId,
  }))

  await knex('SiteConsumable').insert(rows).onConflict(['siteId', 'consumableId']).ignore()
}

const insertSite = (knex, site) => {
  if (!site.guid) site.guid = uuid.v4()
  if (!site.institutionGuid) site.institutionGuid = uuid.v4()
  if (!site.institutionName) site.institutionName = site.name

  return knex('Site').insert(site)
}

function getSiteListQuery(query, dataConstraints) {
  const baseSiteQuery = getSitesQuery(dataConstraints)
  const siteQuery = baseSiteQuery
    .clone()
    .where(function () {
      if (!query.siteIds) {
        return
      }
      this.whereIn('s.id', query.siteIds.split(','))
    })
    .andWhere(function () {
      if (!query.deviceName) {
        return
      }
      const deviceQuery = knex('Device as d')
        .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
        .select('d.siteId')
        .modify(filterParams, query, {
          deviceName: 'd.name',
          deviceType: 'dt.externalId',
        })

      this.whereIn('s.id', deviceQuery)
    })
    .modify(filterDateRangeParams, query, 's.createdOn')
    .modify(
      filterParams,
      query,
      {
        countryId: 'g.countryId',
        stateId: 'g.stateId',
        lgaId: 'g.lgaId',
        siteName: 's.name',
        externalId: 's.externalId',
        parentWarehouseId: 's.parentWarehouseId',
        siteTypeId: 'st.id',
        siteTypeName: 'st.name',
      },
      { whereArgs: { handleNullValues: true } }
    )

  return siteQuery
}

function getSiteTypeIdByExternalId(siteTypeExternalId) {
  return knex('SiteType').where('externalId', siteTypeExternalId).first('id')
}

function getSiteListModifiedQuery(query, dataConstraints) {
  const getItems = getSiteListQuery(query, dataConstraints)
    .clone()
    .modify(sortPageParams, query, 'name')
    .select([
      ...SELECT_LIST_FIELDS,
      getNotDecommissionedDevices(dataConstraints).whereRaw('d.siteId = s.id').count('d.siteId').as('totalDevices'),
    ])
  return getItems
}
module.exports = {
  getExistingSite,
  getExistingSiteExcludingCurrent,
  updateSite,
  updateSiteConsumable,
  updateSiteConsumablesBatch,
  insertSiteConsumables,
  checkSiteAccess,
  checkSitesAccess,
  getSiteIdByName,
  insertSite,
  getSitesQuery,
  getSiteListQuery,
  getSiteListModifiedQuery,
  getSiteTypeIdByExternalId,
}
