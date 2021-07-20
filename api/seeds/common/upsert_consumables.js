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

/**
 * Upserts data in Consumable and ConsumableAssay tables
 * @param {object} knex
 * @param {boolean} allowInserts If false, only updates will be executed
 * @param {array} whitelist The array of assays external ids which consumables will be upserted
 */
module.exports = async (knex, allowInserts = true, whitelist = []) => {
  const consumablesFixture = await getConsumables()

  if (whitelist.length === 0)
    whitelist = await knex('Assay').pluck('externalId')

  const whitelistedConsumablesFixture = consumablesFixture.filter(
    ({ assays }) =>
      assays.filter(a => includes(whitelist, a.externalId)).length > 0
  )
  const consumablesToUpsert = await Promise.map(
    whitelistedConsumablesFixture,
    async c => {
      if (!c.unit) {
        c.unit = await unitToId('Piece')
      }
      return omit(c, 'assays')
    }
  )
  await upsertItems(
    knex,
    'Consumable',
    ['externalId'],
    consumablesToUpsert,
    allowInserts
  )

  const consumablesAssaysToUpsert = []
  const assayIdByExternalId = await getEntityByExternalId(knex, 'Assay')
  const consumableIdByExternalId = await getEntityByExternalId(
    knex,
    'Consumable'
  )
  whitelistedConsumablesFixture.forEach(
    ({ externalId: consumableExternalId, assays }) => {
      assays.forEach(({ externalId: assayExternalId, quantity }) => {
        consumablesAssaysToUpsert.push({
          consumableId: consumableIdByExternalId[consumableExternalId],
          assayId: assayIdByExternalId[assayExternalId],
          quantity,
        })
      })
    }
  )
  await upsertItems(
    knex,
    'ConsumableAssay',
    ['consumableId', 'assayId'],
    consumablesAssaysToUpsert
  )
}
