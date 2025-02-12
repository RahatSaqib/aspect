/* eslint-disable no-only-tests/no-only-tests */
const chai = require('chai')
const chaiSubset = require('chai-subset')

const { assert } = chai.use(chaiSubset)
const sharedToken = require('../utils/sharedToken')
const server = require('../utils/testUtils')
const { knex } = require('../../src/db')
const { addConstraints, getConstraints } = require('../../src/auth/constraints')

describe('Add Inventory', () => {
  const path = '/api/inventory/add'
  let inventoryItem1
  let inventoryItem2
  let site

  const sendRequest = async payload => {
    return server.put(path).set('Authorization', `Bearer ${sharedToken.token}`).send(payload)
  }

  const assertResponse = (res, status, quantity) => {
    assert.equal(res.status, status, `Expected status ${status}, but got ${res.status}`)
    assert.typeOf(res.body, 'Object', 'Response body should be an object')
    assert.property(res.body, 'data', 'Response should have a "data" property')
    if (quantity !== undefined) {
      assert.equal(
        res.body.data.quantityOnHand,
        quantity,
        `Expected quantityOnHand to be ${quantity}, but got ${res.body.data.quantityOnHand}`
      )
    }
  }

  before(async () => {
    sharedToken.checkToken(server, path)

    // Get constraints and fetch a valid site
    const dataConstraints = await getConstraints({ name: 'admin' })
    ;[site] = await knex('Site as s')
      .join('SiteType as type', 's.siteTypeId', 'type.id')
      .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
      .modify(addConstraints, dataConstraints, {
        site: 's',
        geography: 'g',
      })
      .where('type.externalId', 'lab')
      .select('s.*')
  })

  afterEach(async () => {
    // Clean up inventory items and related records
    await knex('InventoryItem').whereIn('id', [inventoryItem1, inventoryItem2].filter(Boolean)).delete()

    await knex('FactInventoryConsumptionRate').where('siteId', site.id).delete()
  })

  it('should add inventory if lotNumber is not passed and increase quantity on duplicate expiresOn without lotNumber', async () => {
    const payload1 = {
      dateAdjusted: '2025-01-07T14:45:08.387Z',
      toSiteId: site.id,
      consumableId: 8,
      quantity: 200,
      expiresOn: '2025-01-27T00:00:00Z',
    }

    const payload2 = {
      dateAdjusted: '2025-01-07T14:45:08.387Z',
      toSiteId: site.id,
      consumableId: 8,
      quantity: 150,
      expiresOn: '2025-01-27T00:00:00Z', // Same expiresOn as payload1
    }

    const res1 = await sendRequest(payload1)
    const res2 = await sendRequest(payload2)

    inventoryItem1 = res1.body.data.id

    // Assert the first request created the inventory
    assertResponse(res1, 200, 200)

    // Assert the second request updated the quantity
    assertResponse(res2, 200, 350) // 200 + 150
  })

  it('should add inventory if expiresOn is not passed and increase quantity on duplicate lotNumber without expiresOn', async () => {
    const payload1 = {
      dateAdjusted: '2025-01-07T14:45:08.387Z',
      toSiteId: site.id,
      consumableId: 8,
      quantity: 200,
      lotNumber: '1090986432411',
    }

    const payload2 = {
      dateAdjusted: '2025-01-07T14:45:08.387Z',
      toSiteId: site.id,
      consumableId: 8,
      quantity: 150,
      lotNumber: '1090986432411', // Same lotNumber as payload1
    }

    const res1 = await sendRequest(payload1)
    const res2 = await sendRequest(payload2)

    inventoryItem1 = res1.body.data.id

    // Assert the first request created the inventory
    assertResponse(res1, 200, 200)

    // Assert the second request updated the quantity
    assertResponse(res2, 200, 350) // 200 + 150
  })

  it('should add inventory if both lotNumber and expiresOn are present and update quantity on duplicate combination', async () => {
    const payload = {
      dateAdjusted: '2025-01-07T14:45:08.387Z',
      toSiteId: site.id,
      consumableId: 8,
      quantity: 200,
      lotNumber: '1090986432411',
      expiresOn: '2025-01-27T00:00:00Z',
    }

    // First request to add the inventory
    const res1 = await sendRequest(payload)

    // Second request to update the quantity
    const res2 = await sendRequest(payload)

    inventoryItem1 = res1.body.data.id

    // Assert the first request created the inventory
    assertResponse(res1, 200, 200)

    // Assert the second request updated the quantity
    assertResponse(res2, 200, 400) // 200 + 200
  })
})
