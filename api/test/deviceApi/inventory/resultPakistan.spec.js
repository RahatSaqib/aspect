const chai = require('chai')
const chaiSubset = require('chai-subset')
const _ = require('lodash')
const { subDays, addDays, startOfDay } = require('date-fns')
const { knex } = require('../../../src/db')
const { parseDateOrDefault } = require('../../../src/shared/date')
const { createTestContext } = require('../utils')
const { consumableReasonToId } = require('../../../src/shared/dictionary')

const server = require('../../utils/testUtils')

const { assert } = chai.use(chaiSubset)

const devicePath = '/device'
const removeInventoryPath = '/api/inventory/remove'
const transferInventoryPath = '/api/inventory/transfer'
describe('inventory strategy for Pakistan', () => {
  const context = createTestContext(knex, server, {
    user: 'pk_admin',
    password: 'test07',
    type: 'CepheidGeneXpert',
    partner: 'Pakistan NTP',
  })

  before(async () => knex('Consumable').update({ strategy: 'withExpirationDateStrategy' }))
  after(async () =>
    knex('Consumable').update({
      strategy: 'withLotAndExpirationDateStrategy',
    })
  )

  let deviceAuth
  let clientAuth
  let now
  let user
  let siteIds
  let siteId
  let toSiteId
  let createdBy
  let updatedBy
  let adminId
  const assayExternalId = 'GxMtbRif'
  let consumableId
  let past
  let future
  let inventoryItemIdsToDelete

  beforeEach(async () => {
    await context.createDeviceWithResult({ instrumentSerial: '02384702' })
    ;({ deviceAuth, clientAuth, now, user, siteIds } = context)
    ;[siteId, toSiteId] = siteIds
    ;({ id: adminId } = await knex('User').where({ name: user }).first('id'))
    createdBy = adminId
    updatedBy = adminId

    consumableId = (await knex('Consumable as c').where('c.externalId', 'GxMtbRifCartridge').first('c.id')).id

    past = subDays(now, 7)
    future = addDays(startOfDay(now), 7)

    inventoryItemIdsToDelete = []
  })
  afterEach(async () => {
    await knex('InventoryLog').whereIn('inventoryItemId', inventoryItemIdsToDelete).del()
    await knex('InventoryItem').whereIn('id', inventoryItemIdsToDelete).del()
    await context.afterEach()
  })

  async function getInventoryItemsAtSite(knex, siteId) {
    return _.map(
      await knex('InventoryItem')
        .where({ siteId })
        .select('id', 'consumableId', 'expiresOn', 'quantityOnHand')
        .orderBy('id'),
      inventoryItem =>
        _.assign({}, inventoryItem, {
          expiresOn: parseDateOrDefault(inventoryItem.expiresOn),
        })
    )
  }

  const getResultPayload = ({ startedOn, expirationDate }) => {
    return {
      startedOn,
      data: { assay: 'Xpert MTB-RIF', a: 'b' },
      assay: { id: assayExternalId },
      sample: {
        id: Math.random().toString(36).slice(2),
      },
      instrument: { serial: '02384702' },
      consumable: {
        expirationDate,
      },
    }
  }

  it('should deduct inventory item based on expiration date in future', async () => {
    const resultDetails = {
      expirationDate: future.toISOString().split('T')[0],
    }
    const { quantity: inventoryConsumedByTest } = await knex('ConsumableAssay as ca')
      .join('Assay as a', 'ca.assayId', 'a.id')
      .where('a.externalId', assayExternalId)
      .andWhere('ca.consumableId', consumableId)
      .first('ca.quantity')

    const expiresOn = new Date(resultDetails.expirationDate)
    const [expirationDateMatch] = await knex('InventoryItem').insert({
      consumableId,
      siteId,
      expiresOn,
      quantityOnHand: inventoryConsumedByTest + 1,
      createdBy,
      createdOn: past,
      updatedBy,
      updatedOn: past,
    })
    inventoryItemIdsToDelete.push(expirationDateMatch)

    const stockBefore = _.find(
      await getInventoryItemsAtSite(knex, siteId),
      inventoryItem => inventoryItem.expiresOn.toISOString() === expiresOn.toISOString()
    )
    await server
      .post(devicePath)
      .set('Authorization', deviceAuth)
      .send({
        type: {
          id: 'CepheidGeneXpert',
        },
        result: getResultPayload({ startedOn: now, expirationDate: resultDetails.expirationDate }),
      })
      .expect(200)
    const inventoryAfter = await getInventoryItemsAtSite(knex, siteId)
    const stockAfter = _.find(
      inventoryAfter,
      inventoryItem => inventoryItem.expiresOn.toISOString() === expiresOn.toISOString()
    )

    assert.equal(stockAfter.quantityOnHand, stockBefore.quantityOnHand - inventoryConsumedByTest)
  })

  it('should add record to MissingInventoryLots if site has no stock', async () => {
    const resultDetails = {
      expirationDate: future.toISOString().split('T')[0],
    }
    const expiresOn = new Date(resultDetails.expirationDate)
    const [expirationDateMatch] = await knex('InventoryItem').insert({
      consumableId,
      siteId,
      expiresOn,
      quantityOnHand: 0,
      createdBy,
      createdOn: past,
      updatedBy,
      updatedOn: past,
    })
    inventoryItemIdsToDelete.push(expirationDateMatch)

    const res = await server
      .post(devicePath)
      .set('Authorization', deviceAuth)
      .send({
        type: {
          id: 'CepheidGeneXpert',
        },
        result: getResultPayload({ startedOn: now, expirationDate: resultDetails.expirationDate }),
      })
      .expect(200)
    const { aspectResultId: resultId } = res.body

    const missingInventoryLots = await knex('Result').where({
      id: resultId,
      reconciliationDate: null,
    })
    assert.equal(missingInventoryLots.length, 1)
  })

  it.skip('should return error when trying to remove items from site with quantityOnHand=0', async () => {
    /**
     * set inventory item to have 0 quantityOnHand
     */
    const expiresOn = startOfDay(future)
    const quantityOnHand = 0
    const [expirationDateMatch] = await knex('InventoryItem').insert({
      consumableId,
      siteId,
      expiresOn,
      quantityOnHand,
      createdBy,
      createdOn: past,
      updatedBy,
      updatedOn: past,
    })
    inventoryItemIdsToDelete.push(expirationDateMatch)
    /**
     * try to remove 1 inventory item
     */
    const quantity = 1
    const res = await server
      .put(`${removeInventoryPath}`)
      .send({
        consumableId,
        expiresOn,
        quantity,
        notes: 'Testing remove',
        fromSiteId: siteId,
        reasonId: await consumableReasonToId('lost'),
        dateAdjusted: new Date().toISOString(),
      })
      .set('Authorization', clientAuth)

    assert.equal(res.status, 404)
    assert.typeOf(res.body, 'Object')
    assert.property(res.body, 'message')
    assert.equal(
      res.body.message,
      `Not enough inventory items (${quantityOnHand}) on the site to remove ${quantity} items`
    )
  })

  it.skip('should return error when trying to transfer items from site with quantityOnHand=0', async () => {
    /**
     * set inventory item to have 0 quantityOnHand
     */
    const expiresOn = startOfDay(future)
    const quantityOnHand = 0
    const [expirationDateMatch] = await knex('InventoryItem').insert({
      consumableId,
      siteId,
      expiresOn,
      quantityOnHand,
      createdBy,
      createdOn: past,
      updatedBy,
      updatedOn: past,
    })
    inventoryItemIdsToDelete.push(expirationDateMatch)
    /**
     * try to transfer 1 inventory item to another site
     */
    const quantity = 1
    const res = await server
      .put(`${transferInventoryPath}`)
      .send({
        consumableId,
        expiresOn,
        quantity,
        notes: 'Testing transfer',
        fromSiteId: siteId,
        toSiteId,
        dateAdjusted: new Date().toISOString(),
      })
      .set('Authorization', clientAuth)

    assert.equal(res.status, 404)
    assert.typeOf(res.body, 'Object')
    assert.property(res.body, 'message')
    assert.equal(
      res.body.message,
      `Not enough inventory items (${quantityOnHand}) on the site to remove ${quantity} items`
    )
  })
})
