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

describe('GET: /inventory', () => {
  const endpoint = '/api/inventory'
  let testData

  before(async () => {
    // Create test data
    const [siteId] = await knex('Site').insert({
      name: 'Test Site',
      partnerId: 1,
      siteTypeId: 1,
      externalId: 'TEST_SITE_001',
      institutionGuid: 'TEST_INST_001',
      guid: 'TEST_SITE_GUID_001',
    })

    const [consumableId] = await knex('Consumable').insert({
      name: 'Test Consumable',
      manufacturer: 'Test Manufacturer',
      unit: 1,
      externalId: `TEST_CONSUMABLE_${Date.now()}`,
      i18nKey: `TEST_CONSUMABLE_KEY_${Date.now()}`,
    })

    // Get a valid assayTypeId
    const [assayType] = await knex('AssayType').select('id').limit(1)

    if (!assayType) {
      throw new Error('No active assay type found in the database')
    }

    const [assayId] = await knex('Assay').insert({
      name: 'Test Assay',
      deviceTypeId: 1,
      assayTypeId: assayType.id,
      resultSourceId: 1,
      abbreviation: 'TEST',
      externalId: `TEST_ASSAY_${Date.now()}`,
      i18nKey: `TEST_ASSAY_KEY_${Date.now()}`,
    })

    await knex('ConsumableAssay').insert({
      consumableId,
      assayId,
      quantity: 1,
    })

    await knex('SiteConsumable').insert({
      siteId,
      consumableId,
    })

    // Create inventory items
    const [inventoryItem1] = await knex('InventoryItem').insert([
      {
        siteId,
        consumableId,
        lotNumber: 'LOT001',
        expiresOn: '2024-12-31',
        quantityOnHand: 100,
      },
      {
        siteId,
        consumableId,
        lotNumber: 'LOT002',
        expiresOn: '2024-12-31',
        quantityOnHand: 50,
      },
    ])

    // Create results with missing inventory lots
    const [resultId1] = await knex('Result').insert({
      resultSourceId: 1,
      resultTypeId: 1,
      partnerId: 1,
      assayId,
      deviceId: 1,
      sampleId: 1,
      reportableSiteId: 1,
      siteId,
      consumableLot: inventoryItem1.lotNumber,
      consumableExpirationDate: inventoryItem1.expiresOn,
      endedOn: new Date(),
    })

    const [resultId2] = await knex('Result').insert({
      resultSourceId: 1,
      resultTypeId: 1,
      sampleId: 1,
      reportableSiteId: 1,
      partnerId: 1,
      assayId,
      deviceId: 1,
      siteId,
      consumableLot: inventoryItem1.lotNumber,
      consumableExpirationDate: inventoryItem1.expiresOn,
      endedOn: new Date(),
    })

    await knex('MissingInventoryLots').insert([
      {
        siteId,
        resultId: resultId1,
        lotNumber: inventoryItem1.lotNumber,
        expirationDate: inventoryItem1.expiresOn,
        createdOn: new Date(),
      },
      {
        siteId,
        resultId: resultId2,
        lotNumber: inventoryItem1.lotNumber,
        expirationDate: inventoryItem1.expiresOn,
        createdOn: new Date(),
      },
    ])

    testData = {
      siteId,
      consumableId,
      assayId,
      resultId1,
      resultId2,
    }
  })

  after(async () => {
    // Clean up test data
    await knex('MissingInventoryLots').where('siteId', testData.siteId).delete()
    await knex('Result').whereIn('id', [testData.resultId1, testData.resultId2]).delete()
    await knex('InventoryItem').where('siteId', testData.siteId).delete()
    await knex('SiteConsumable').where('siteId', testData.siteId).delete()
    await knex('ConsumableAssay').where('consumableId', testData.consumableId).delete()
    await knex('Consumable').where('id', testData.consumableId).delete()
    await knex('Site').where('id', testData.siteId).delete()
  })

  it('should return 200 with empty response when no inventory items are present', async () => {
    const res = await server.get(endpoint).set('Authorization', `Bearer ${sharedToken.token}`)
    assert.equal(res.status, 200)
    assert.equal(res.body.data.length, 0)
  })

  it('should return the inventory items with correct unreconciled quantity despite duplicate consumables with different lot numbers', async () => {
    const [withoutBreakoutByLotOption, withBreakoutByLotOption] = await Promise.all([
      server
        .get(endpoint)
        .query({
          sortCol: 'siteName',
          sortDir: 'asc',
          page: 0,
          size: 10,
          hasStock: true,
        })
        .set('Authorization', `Bearer ${sharedToken.token}`),
      server
        .get('/api/inventory')
        .query({
          sortCol: 'siteName',
          sortDir: 'asc',
          page: 0,
          size: 10,
          hasStock: true,
          breakoutByLot: true,
        })
        .set('Authorization', `Bearer ${sharedToken.token}`),
    ])
    assert.equal(withoutBreakoutByLotOption.body.data.length, 1)
    assert.equal(withBreakoutByLotOption.body.data.length, 2)
    assert.equal(withoutBreakoutByLotOption.body.data[0].unreconciledQuantity, 1)
    assert.equal(withBreakoutByLotOption.body.data[0].unreconciledQuantity, 1)
    assert.equal(withBreakoutByLotOption.body.data[1].unreconciledQuantity, 0)
  })
})
