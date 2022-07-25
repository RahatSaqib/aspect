const { includes, omit } = require('lodash')
const Promise = require('bluebird')
const { unitToId } = require('../../src/shared/dictionary')
const getConsumables = require('../fixtures/Consumable')
const { upsertItems } = require('../utils')

const getEntityByExternalId = async (knex, table) => {
  const ids = await knex(table).select(['externalId', 'id'])
  let byExternalId = {}
  ids.forEach(ids => {
    byExternalId = {
      [ids.externalId]: ids.id,
      ...byExternalId,
    }
  })
  return byExternalId
}

const upsertConsumableAssay = async (knex, whitelistedConsumablesFixture) => {
  const consumablesAssaysToUpsert = []
  const assayIdByExternalId = await getEntityByExternalId(knex, 'Assay')
  const consumableIdByExternalId = await getEntityByExternalId(knex, 'Consumable')

  // Upsert ConsumableAssay table, ignoring the unexistiant assays and consumables
  whitelistedConsumablesFixture.forEach(({ externalId: consumableExternalId, assays }) => {
    assays.forEach(({ externalId: assayExternalId, quantity }) => {
      if (assayIdByExternalId[assayExternalId] && consumableIdByExternalId[consumableExternalId])
        consumablesAssaysToUpsert.push({
          consumableId: consumableIdByExternalId[consumableExternalId],
          assayId: assayIdByExternalId[assayExternalId],
          quantity,
        })
    })
  })
  await upsertItems(knex, 'ConsumableAssay', ['consumableId', 'assayId'], consumablesAssaysToUpsert)
}

/**
 * Upserts data in Consumable and ConsumableAssay tables
 * @param {object} knex
 * @param {boolean} allowInserts If false, only updates will be executed
 * @param {array} assayWhitelist The array of assays external ids which consumables will be upserted
 */
module.exports = async (knex, allowInserts = true, assayWhitelist = []) => {
  const consumablesFixture = await getConsumables()

  if (assayWhitelist.length === 0) assayWhitelist = await knex('Assay').pluck('externalId')

  // Upsert Consumable table, only whitelisted
  const whitelistedConsumablesFixture = consumablesFixture.filter(
    ({ assays }) => assays.filter(a => includes(assayWhitelist, a.externalId)).length > 0
  )
  const consumablesToUpsert = await Promise.map(whitelistedConsumablesFixture, async c => {
    if (!c.unit) {
      c.unit = await unitToId('Piece')
    }
    return omit(c, 'assays')
  })
  await upsertItems(knex, 'Consumable', ['externalId'], consumablesToUpsert, allowInserts)

  await upsertConsumableAssay(knex, whitelistedConsumablesFixture)
}
