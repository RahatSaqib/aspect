/* eslint-disable no-only-tests/no-only-tests */
const chai = require('chai')
const chaiSubset = require('chai-subset')
const addHours = require('date-fns/addHours')

const { assert } = chai.use(chaiSubset)
const sharedToken = require('../utils/sharedToken')
const server = require('../utils/testUtils')
const { knex } = require('../../src/db')
const { addConstraints, getConstraints } = require('../../src/auth/constraints')
const { consumableReasonToId } = require('../../src/shared/dictionary')
const { createGxConnectTestContext } = require('../deviceApi/geneXpert/gxconnect_utils')

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
    await knex('InventoryLog').where('siteId', site.id).delete()
    await knex('FactInventoryConsumptionRate').where('siteId', site.id).delete()
  })

  it('should add inventory if lotNumber is not passed and increase quantity on duplicate expiresOn without lotNumber', async () => {
    const payload1 = {
      dateAdjusted: '2025-01-07T14:45:08.387Z',
      toSiteId: site.id,
      consumableId: 8,
      reasonId: await consumableReasonToId('manual_addition'),
      quantity: 200,
      expiresOn: '2025-01-27T00:00:00Z',
    }

    const payload2 = {
      dateAdjusted: '2025-01-07T14:45:08.387Z',
      toSiteId: site.id,
      consumableId: 8,
      reasonId: await consumableReasonToId('manual_addition'),
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
      reasonId: await consumableReasonToId('manual_addition'),
      quantity: 200,
      lotNumber: '1090986432411',
    }

    const payload2 = {
      dateAdjusted: '2025-01-07T14:45:08.387Z',
      toSiteId: site.id,
      consumableId: 8,
      reasonId: await consumableReasonToId('manual_addition'),
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
      reasonId: await consumableReasonToId('manual_addition'),
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

describe('GET: /api/inventory', () => {
  const endpoint = '/api/inventory'
  let testData
  const testContext = createGxConnectTestContext(server, {
    countryCode: 'US',
    adminUsername: 'admin',
    adminPassword: 'test07',
    deviceName: 'New GeneXpert Laboratory',
    macAddress: 'MAC00000000FAKE',
    deviceSerialNumber: 'Cepheid-PC-BLH',
  })

  before(async () => {
    await testContext.registerAndSetDevice()

    const {
      device: { partnerId, siteId, id: deviceId },
    } = testContext

    const { assayId, consumableId } = await knex('ConsumableAssay').where({}).first()

    await knex('SiteConsumable').insert({
      siteId,
      consumableId,
    })

    // Create inventory items
    await knex('InventoryItem').insert([
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

    const [inventoryItem1, inventoryItem2] = await knex('InventoryItem').where({ siteId, consumableId })
    // Create results with missing inventory lots
    const [resultId1] = await knex('Result').insert({
      resultSourceId: 1,
      resultTypeId: 1,
      partnerId,
      assayId,
      deviceId,
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
      partnerId,
      assayId,
      deviceId,
      siteId,
      consumableLot: inventoryItem1.lotNumber,
      consumableExpirationDate: inventoryItem1.expiresOn,
      endedOn: new Date(),
    })

    const [resultId3] = await knex('Result').insert({
      resultSourceId: 1,
      resultTypeId: 1,
      sampleId: 1,
      reportableSiteId: 1,
      partnerId,
      assayId,
      deviceId,
      siteId,
      consumableLot: inventoryItem1.lotNumber,
      endedOn: new Date(),
    })

    testData = {
      partnerId,
      siteId,
      consumableId,
      assayId,
      resultId1,
      resultId2,
      resultId3,
      inventoryItemIds: [inventoryItem1, inventoryItem2].map(item => item.id),
    }
  })

  beforeEach(async () => {
    await knex('Partner').where('id', testData.partnerId).update({
      inventoryStrategy: 'withLotAndExpirationDateStrategy',
    })
  })

  after(async () => {
    // Clean up test data
    await knex('Result').where('siteId', testData.siteId).delete()
    await knex('InventoryItem').where('siteId', testData.siteId).delete()
    await knex('SiteConsumable').where({ siteId: testData.siteId, consumableId: testData.consumableId }).delete()
    await testContext.cleanUp()
  })

  it('should return 200 with all inventory items grouped by site and consumable when default query parameters are set', async () => {
    const response = await server
      .get(`${endpoint}?siteId=${testData.siteId}`)
      .set('Authorization', `Bearer ${sharedToken.token}`)
    assert.equal(response.status, 200)
    assert.equal(response.body.data.length, 1)
    // Should be aggregated quantity on hand for the consumable under a site and consumable
    assert.equal(response.body.data[0].quantityOnHand, 150)
  })

  it('should return the inventory items with correct unreconciled quantity, quantityOnHand despite duplicate consumables with different lot numbers', async () => {
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
        .get(endpoint)
        .query({
          sortCol: 'siteName',
          sortDir: 'asc',
          page: 0,
          size: 10,
          hasStock: true,
          breakOutByLot: true,
        })
        .set('Authorization', `Bearer ${sharedToken.token}`),
    ])

    assert.equal(withoutBreakoutByLotOption.body.data.length, 1)
    assert.equal(withBreakoutByLotOption.body.data.length, 2)

    assert.equal(withoutBreakoutByLotOption.body.data[0].unreconciledQuantity, 3)
    assert.equal(withoutBreakoutByLotOption.body.data[0].quantityOnHand, 150)
    assert.equal(withoutBreakoutByLotOption.body.data[0].siteId, testData.siteId)
    assert.equal(withoutBreakoutByLotOption.body.data[0].consumableId, testData.consumableId)

    assert.equal(withBreakoutByLotOption.body.data[0].lotNumber, 'LOT001')
    assert.equal(withBreakoutByLotOption.body.data[0].unreconciledQuantity, 3)
    assert.equal(withBreakoutByLotOption.body.data[0].quantityOnHand, 100)
    assert.equal(withBreakoutByLotOption.body.data[0].siteId, testData.siteId)
    assert.equal(withBreakoutByLotOption.body.data[0].consumableId, testData.consumableId)

    // The second item is the same consumable with different lot number
    assert.equal(withBreakoutByLotOption.body.data[1].lotNumber, 'LOT002')
    assert.equal(withBreakoutByLotOption.body.data[1].unreconciledQuantity, 0)
    assert.equal(withBreakoutByLotOption.body.data[1].quantityOnHand, 50)
    assert.equal(withBreakoutByLotOption.body.data[1].siteId, testData.siteId)
    assert.equal(withBreakoutByLotOption.body.data[1].consumableId, testData.consumableId)
  })

  it('should return 200 with inventory items when breakout by lot is selected and inventory strategy is expire date only', async () => {
    await knex('Partner').where('id', testData.partnerId).update({
      inventoryStrategy: 'withExpirationDateStrategy',
    })

    const response = await server
      .get(endpoint)
      .query({
        sortCol: 'siteName',
        sortDir: 'asc',
        page: 0,
        size: 10,
        hasStock: true,
        breakOutByLot: true,
      })
      .set('Authorization', `Bearer ${sharedToken.token}`)

    assert.equal(response.status, 200)
    assert.equal(response.body.data.length, 1)
    assert.equal(response.body.data[0].quantityOnHand, 150)
    assert.equal(response.body.data[0].unreconciledQuantity, 3)
    assert.equal(response.body.data[0].lotNumber, undefined)
  })

  it('should return 200 with inventory items when breakout by lot is selected and inventory strategy is lot only', async () => {
    await knex('Partner').where('id', testData.partnerId).update({
      inventoryStrategy: 'withLotStrategy',
    })

    const response = await server
      .get(endpoint)
      .query({
        sortCol: 'siteName',
        sortDir: 'asc',
        page: 0,
        size: 10,
        hasStock: true,
        breakOutByLot: true,
      })
      .set('Authorization', `Bearer ${sharedToken.token}`)

    assert.equal(response.status, 200)
    assert.equal(response.body.data.length, 2)
    assert.equal(response.body.data[0].quantityOnHand, 100)
    assert.equal(response.body.data[0].unreconciledQuantity, 3)
    assert.equal(response.body.data[0].lotNumber, 'LOT001')
    assert.equal(response.body.data[0].expiresOn, undefined)
    assert.equal(response.body.data[1].quantityOnHand, 50)
    assert.equal(response.body.data[1].unreconciledQuantity, 0)
    assert.equal(response.body.data[1].lotNumber, 'LOT002')
    assert.equal(response.body.data[1].expiresOn, undefined)
  })
})

describe('POST: /api/inventory/auto-reconcile', () => {
  const endpoint = '/api/inventory/auto-reconcile'
  let testData
  const testContext = createGxConnectTestContext(server, {
    countryCode: 'US',
    adminUsername: 'admin',
    adminPassword: 'test07',
    deviceName: 'New GeneXpert Laboratory',
    macAddress: 'MAC00000000FAKE',
    deviceSerialNumber: 'Cepheid-PC-BLH',
  })

  beforeEach(async () => {
    await testContext.registerAndSetDevice()

    const {
      device: { partnerId, siteId, id: deviceId },
    } = testContext

    const { assayId, consumableId } = await knex('ConsumableAssay').where({}).first()

    const site = await knex('Site')
      .where({
        id: siteId,
      })
      .first()

    const [nationalWarehouseId] = await knex('Site').insert({
      name: 'National Warehouse',
      siteTypeId: (await knex('SiteType').where('externalId', 'warehouse').select('id').first()).id,
      geographyId: site.geographyId,
      partnerId,
      externalId: 'national-warehouse-external-id',
      institutionGuid: site.institutionGuid,
      guid: site.guid,
    })

    const [stockProviderSiteId] = await knex('Site').insert({
      name: 'Stock Provider',
      siteTypeId: (await knex('SiteType').where('externalId', 'clinic').select('id').first()).id,
      geographyId: site.geographyId,
      partnerId,
      parentWarehouseId: nationalWarehouseId,
      externalId: 'stock-provider-external-id',
      institutionGuid: site.institutionGuid,
      guid: site.guid,
    })

    await knex('Site').where('id', siteId).update({
      parentWarehouseId: stockProviderSiteId,
    })
    await knex('SiteConsumable').insert([
      {
        siteId,
        consumableId,
      },
      {
        siteId: stockProviderSiteId,
        consumableId,
      },
      {
        siteId: nationalWarehouseId,
        consumableId,
      },
    ])

    // Create inventory items
    await knex('InventoryItem').insert([
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

    const [inventoryItem1, inventoryItem2] = await knex('InventoryItem').where({ siteId, consumableId })

    // Create results with missing inventory lots
    const [resultId1] = await knex('Result').insert({
      resultSourceId: 1,
      resultTypeId: 1,
      partnerId,
      assayId,
      deviceId,
      sampleId: 1,
      reportableSiteId: 1,
      siteId,
      consumableLot: inventoryItem1.lotNumber,
      consumableExpirationDate: inventoryItem1.expiresOn,
      endedOn: new Date(),
    })

    testData = {
      partnerId,
      siteId,
      consumableId,
      assayId,
      resultId1,
      inventoryItemIds: [inventoryItem1, inventoryItem2].map(item => item.id),
      nationalWarehouseId,
      stockProviderSiteId,
    }

    await knex('Partner').where('id', partnerId).update({
      inventoryStrategy: 'withLotAndExpirationDateStrategy',
    })
  })

  afterEach(async () => {
    // Clean up test data

    // Delete InventoryTransfer records that reference InventoryLog through incomeInventoryLogId
    await knex('InventoryTransfer')
      .whereIn('incomeInventoryLogId', function () {
        this.select('id')
          .from('InventoryLog')
          .whereIn('siteId', [testData.siteId, testData.stockProviderSiteId, testData.nationalWarehouseId])
      })
      .delete()

    // Delete InventoryTransfer records that reference tempInventoryItemId
    await knex('InventoryTransfer').whereIn('tempInventoryItemId', testData.inventoryItemIds).delete()

    await knex('InventoryLog')
      .whereIn('siteId', [testData.siteId, testData.stockProviderSiteId, testData.nationalWarehouseId])
      .delete()
    await knex('Result').where('siteId', testData.siteId).delete()
    await knex('InventoryItem')
      .whereIn('siteId', [testData.siteId, testData.stockProviderSiteId, testData.nationalWarehouseId])
      .delete()
    await knex('SiteConsumable').where({ consumableId: testData.consumableId }).delete()
    await knex('Site')
      .whereIn('id', [testData.siteId, testData.stockProviderSiteId, testData.nationalWarehouseId])
      .update({ parentWarehouseId: null })
    await knex('Site')
      .whereIn('id', [testData.siteId, testData.stockProviderSiteId, testData.nationalWarehouseId])
      .delete()
    await testContext.cleanUp()
  })

  describe('Inventory Adjustment = Current Site Adjustment', () => {
    it('should use inventory at current site when inventory adjustment is current site adjustment', async () => {
      await knex('Partner').where('id', testData.partnerId).update({
        inventoryAdjustment: 'currentSiteAdjustment',
      })
      const missingLotsBeforeReconcile = await knex('Result').where({
        reconciliationDate: null,
        siteId: testData.siteId,
      })
      const inventoryItemBeforeReconcile = await knex('InventoryItem').where('id', testData.inventoryItemIds[0]).first()

      const response = await server.post(endpoint).set('Authorization', `Bearer ${sharedToken.token}`).send({})

      assert.equal(response.status, 200)
      assert.equal(response.body.ok, true)

      // Verify that the missing inventory lots were reconciled
      assert.equal(missingLotsBeforeReconcile.length, 1, 'There should be 1 missing inventory lot before reconcile')
      const missingLotsAfterReconcile = await knex('Result').where({
        reconciliationDate: null,
        siteId: testData.siteId,
      })
      assert.equal(missingLotsAfterReconcile.length, 0, 'All missing inventory lots should be reconciled')

      // Verify that the inventory item quantity on hand was updated
      assert.equal(
        inventoryItemBeforeReconcile.quantityOnHand,
        100,
        'Inventory item should have 100 quantity on hand before reconcile'
      )
      const inventoryItemAfterReconcile = await knex('InventoryItem').where('id', testData.inventoryItemIds[0]).first()
      assert.equal(
        inventoryItemAfterReconcile.quantityOnHand,
        99,
        'Inventory item should have 99 quantity on hand after reconcile'
      )
    })

    it('should not reconcile inventory when inventory adjustment is current site adjustment and there is no inventory at current site', async () => {
      await knex('InventoryItem').where('id', testData.inventoryItemIds[0]).update({
        siteId: testData.stockProviderSiteId,
      })
      await knex('Partner').where('id', testData.partnerId).update({
        inventoryAdjustment: 'currentSiteAdjustment',
      })
      const missingLotsBeforeReconcile = await knex('Result').where({
        reconciliationDate: null,
        siteId: testData.siteId,
      })
      const inventoryItemBeforeReconcile = await knex('InventoryItem').where('id', testData.inventoryItemIds[0]).first()

      const response = await server.post(endpoint).set('Authorization', `Bearer ${sharedToken.token}`).send({})

      assert.equal(response.status, 200)
      assert.equal(response.body.ok, true)

      // Verify that the missing inventory lots were reconciled
      assert.equal(missingLotsBeforeReconcile.length, 1, 'There should be 1 missing inventory lot before reconcile')
      const missingLotsAfterReconcile = await knex('Result').where({
        reconciliationDate: null,
        siteId: testData.siteId,
      })
      assert.equal(missingLotsAfterReconcile.length, 1, 'No missing inventory lots should be reconciled')

      // Verify that the inventory item quantity on hand was updated
      assert.equal(
        inventoryItemBeforeReconcile.quantityOnHand,
        100,
        'Inventory item should have 100 quantity on hand before reconcile'
      )
      const inventoryItemAfterReconcile = await knex('InventoryItem').where('id', testData.inventoryItemIds[0]).first()
      assert.equal(
        inventoryItemAfterReconcile.quantityOnHand,
        100,
        'Inventory item should have 100 quantity on hand after reconcile'
      )
    })
  })

  describe('Inventory Adjustment = Stock Provider Site Adjustment', () => {
    it('should use inventory at current provider site when inventory adjustment set is current site and stock provider adjustment', async () => {
      await knex('Partner').where('id', testData.partnerId).update({
        inventoryAdjustment: 'currentSiteAndProviderAdjustment',
      })

      const inventoryItemBeforeReconcile = await knex('InventoryItem').where('id', testData.inventoryItemIds[0]).first()

      const missingLotsBeforeReconcile = await knex('Result').where({
        reconciliationDate: null,
        siteId: testData.siteId,
      })

      const response = await server.post(endpoint).set('Authorization', `Bearer ${sharedToken.token}`).send({})

      assert.equal(response.status, 200)
      assert.equal(response.body.ok, true)

      assert.equal(missingLotsBeforeReconcile.length, 1, 'There should be 1 missing inventory lot before reconcile')
      // Verify that the missing inventory lots were reconciled
      const missingLotsAfterReconcile = await knex('Result').where({
        reconciliationDate: null,
        siteId: testData.siteId,
      })
      assert.equal(missingLotsAfterReconcile.length, 0, 'All missing inventory lots should be reconciled')

      // Verify that the inventory item quantity on hand was updated
      assert.equal(
        inventoryItemBeforeReconcile.quantityOnHand,
        100,
        'Inventory item should have 100 quantity on hand before reconcile'
      )
      const inventoryItemAfterReconcile = await knex('InventoryItem').where('id', testData.inventoryItemIds[0]).first()
      assert.equal(
        inventoryItemAfterReconcile.quantityOnHand,
        99,
        'Inventory item should have 99 quantity on hand after reconcile'
      )
    })

    it('should use inventory at stock provider site when inventory adjustment set is current site and stock provider adjustment', async () => {
      await knex('InventoryItem').where('id', testData.inventoryItemIds[0]).update({
        siteId: testData.stockProviderSiteId,
      })
      await knex('Partner').where('id', testData.partnerId).update({
        inventoryAdjustment: 'currentSiteAndProviderAdjustment',
      })

      const inventoryItemBeforeReconcile = await knex('InventoryItem').where('id', testData.inventoryItemIds[0]).first()

      const missingLotsBeforeReconcile = await knex('Result').where({
        reconciliationDate: null,
        siteId: testData.siteId,
      })

      const response = await server.post(endpoint).set('Authorization', `Bearer ${sharedToken.token}`).send({})

      assert.equal(response.status, 200)
      assert.equal(response.body.ok, true)

      assert.equal(missingLotsBeforeReconcile.length, 1, 'There should be 1 missing inventory lot before reconcile')
      const missingLotsAfterReconcile = await knex('Result').where({
        reconciliationDate: null,
        siteId: testData.siteId,
      })
      assert.equal(missingLotsAfterReconcile.length, 0, 'All missing inventory lots should be reconciled')

      // Verify that the inventory item quantity on hand was updated
      assert.equal(
        inventoryItemBeforeReconcile.quantityOnHand,
        100,
        'Inventory item should have 100 quantity on hand before reconcile'
      )
      const inventoryItemAfterReconcile = await knex('InventoryItem').where('id', testData.inventoryItemIds[0]).first()
      assert.equal(
        inventoryItemAfterReconcile.quantityOnHand,
        99,
        'Inventory item should have 99 quantity on hand after reconcile'
      )
    })

    it('should not reconcile inventory when inventory adjustment set is current site and stock provider adjustment and there is no inventory at stock provider site, but exists at national warehouse', async () => {
      await knex('InventoryItem').where('id', testData.inventoryItemIds[0]).update({
        siteId: testData.nationalWarehouseId,
      })
      await knex('Partner').where('id', testData.partnerId).update({
        inventoryAdjustment: 'currentSiteAndProviderAdjustment',
      })

      const inventoryItemBeforeReconcile = await knex('InventoryItem').where('id', testData.inventoryItemIds[0]).first()

      const missingLotsBeforeReconcile = await knex('Result').where({
        reconciliationDate: null,
        siteId: testData.siteId,
      })

      const response = await server.post(endpoint).set('Authorization', `Bearer ${sharedToken.token}`).send({})

      assert.equal(response.status, 200)
      assert.equal(response.body.ok, true)

      assert.equal(missingLotsBeforeReconcile.length, 1, 'There should be 1 missing inventory lot before reconcile')
      const missingLotsAfterReconcile = await knex('Result').where({
        reconciliationDate: null,
        siteId: testData.siteId,
      })
      assert.equal(missingLotsAfterReconcile.length, 1, 'No missing inventory lots should be reconciled')

      const inventoryItemAfterReconcile = await knex('InventoryItem').where('id', testData.inventoryItemIds[0]).first()
      assert.equal(
        inventoryItemBeforeReconcile.quantityOnHand,
        100,
        'Inventory item should have 100 quantity on hand before reconcile'
      )
      assert.equal(
        inventoryItemAfterReconcile.quantityOnHand,
        100,
        'Inventory item should have 100 quantity on hand after reconcile'
      )
    })
  })

  describe('Inventory Adjustment = National Level Adjustment', () => {
    it('should use inventory at current provider site when inventory adjustment set is current site, stock provider and national level adjustment', async () => {
      await knex('Partner').where('id', testData.partnerId).update({
        inventoryAdjustment: 'currentSiteAndProviderAndNationalAdjustment',
      })

      const inventoryItemBeforeReconcile = await knex('InventoryItem').where('id', testData.inventoryItemIds[0]).first()

      const missingLotsBeforeReconcile = await knex('Result').where({
        reconciliationDate: null,
        siteId: testData.siteId,
      })

      const response = await server.post(endpoint).set('Authorization', `Bearer ${sharedToken.token}`).send({})

      assert.equal(response.status, 200)
      assert.equal(response.body.ok, true)

      assert.equal(missingLotsBeforeReconcile.length, 1, 'There should be 1 missing inventory lot before reconcile')
      // Verify that the missing inventory lots were reconciled
      const missingLotsAfterReconcile = await knex('Result').where({
        reconciliationDate: null,
        siteId: testData.siteId,
      })
      assert.equal(missingLotsAfterReconcile.length, 0, 'All missing inventory lots should be reconciled')

      // Verify that the inventory item quantity on hand was updated
      assert.equal(
        inventoryItemBeforeReconcile.quantityOnHand,
        100,
        'Inventory item should have 100 quantity on hand before reconcile'
      )
      const inventoryItemAfterReconcile = await knex('InventoryItem').where('id', testData.inventoryItemIds[0]).first()
      assert.equal(
        inventoryItemAfterReconcile.quantityOnHand,
        99,
        'Inventory item should have 99 quantity on hand after reconcile'
      )
    })

    it('should use inventory at stock provider site when inventory adjustment set is current site, stock provider and national level adjustment', async () => {
      await knex('InventoryItem').where('id', testData.inventoryItemIds[0]).update({
        siteId: testData.stockProviderSiteId,
      })
      await knex('Partner').where('id', testData.partnerId).update({
        inventoryAdjustment: 'currentSiteAndProviderAndNationalAdjustment',
      })

      const inventoryItemBeforeReconcile = await knex('InventoryItem').where('id', testData.inventoryItemIds[0]).first()

      const missingLotsBeforeReconcile = await knex('Result').where({
        reconciliationDate: null,
        siteId: testData.siteId,
      })

      const response = await server.post(endpoint).set('Authorization', `Bearer ${sharedToken.token}`).send({})

      assert.equal(response.status, 200)
      assert.equal(response.body.ok, true)

      assert.equal(missingLotsBeforeReconcile.length, 1, 'There should be 1 missing inventory lot before reconcile')
      const missingLotsAfterReconcile = await knex('Result').where({
        reconciliationDate: null,
        siteId: testData.siteId,
      })
      assert.equal(missingLotsAfterReconcile.length, 0, 'All missing inventory lots should be reconciled')

      // Verify that the inventory item quantity on hand was updated
      assert.equal(
        inventoryItemBeforeReconcile.quantityOnHand,
        100,
        'Inventory item should have 100 quantity on hand before reconcile'
      )
      const inventoryItemAfterReconcile = await knex('InventoryItem').where('id', testData.inventoryItemIds[0]).first()
      assert.equal(
        inventoryItemAfterReconcile.quantityOnHand,
        99,
        'Inventory item should have 99 quantity on hand after reconcile'
      )
    })

    it('should use inventory at national warehouse when inventory adjustment set is current site, stock provider and national level adjustment and there is no inventory at current site or stock provider site', async () => {
      await knex('InventoryItem').where('id', testData.inventoryItemIds[0]).update({
        siteId: testData.nationalWarehouseId,
      })
      await knex('Partner').where('id', testData.partnerId).update({
        inventoryAdjustment: 'currentSiteAndProviderAndNationalAdjustment',
      })

      const inventoryItemBeforeReconcile = await knex('InventoryItem').where('id', testData.inventoryItemIds[0]).first()

      const missingLotsBeforeReconcile = await knex('Result').where({
        reconciliationDate: null,
        siteId: testData.siteId,
      })

      const response = await server.post(endpoint).set('Authorization', `Bearer ${sharedToken.token}`).send({})

      assert.equal(response.status, 200)
      assert.equal(response.body.ok, true)

      assert.equal(missingLotsBeforeReconcile.length, 1, 'There should be 1 missing inventory lot before reconcile')
      const missingLotsAfterReconcile = await knex('Result').where({
        reconciliationDate: null,
        siteId: testData.siteId,
      })
      assert.equal(missingLotsAfterReconcile.length, 0, 'All missing inventory lots should be reconciled')

      // Verify that the inventory item quantity on hand was updated
      assert.equal(
        inventoryItemBeforeReconcile.quantityOnHand,
        100,
        'Inventory item should have 100 quantity on hand before reconcile'
      )
      const inventoryItemAfterReconcile = await knex('InventoryItem').where('id', testData.inventoryItemIds[0]).first()
      assert.equal(
        inventoryItemAfterReconcile.quantityOnHand,
        99,
        'Inventory item should have 99 quantity on hand after reconcile'
      )
    })
  })
})

describe('Reset Inventory', () => {
  const path = '/api/inventory/add'
  let inventoryItem1
  let site
  let partnerId
  let deviceId
  let resultId1
  const testContext = createGxConnectTestContext(server, {
    countryCode: 'US',
    adminUsername: 'admin',
    adminPassword: 'test07',
    deviceName: 'New GeneXpert Laboratory',
    macAddress: 'MAC00000000FAKE',
    deviceSerialNumber: 'Cepheid-PC-BLH',
  })

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

    await testContext.registerAndSetDevice()

    const deviceInfo = testContext.device
    if (deviceInfo) {
      partnerId = deviceInfo.partnerId
      deviceId = deviceInfo.id
    }
  })

  beforeEach(async () => {
    const payload1 = {
      dateAdjusted: '2025-01-07T14:45:08.387Z',
      toSiteId: site.id,
      consumableId: 8,
      reasonId: await consumableReasonToId('manual_addition'),
      quantity: 200,
      lotNumber: 'LOT001',
      expiresOn: '2025-01-27T00:00:00Z',
    }
    const payload2 = {
      dateAdjusted: '2025-01-07T14:45:08.387Z',
      toSiteId: site.id,
      consumableId: 8,
      reasonId: await consumableReasonToId('manual_addition'),
      quantity: 150,
      lotNumber: 'LOT001',
      expiresOn: '2025-01-27T00:00:00Z',
    }

    const res1 = await sendRequest(payload1)
    await sendRequest(payload2)

    inventoryItem1 = res1.body.data

    const { assayId } = await knex('ConsumableAssay').where('consumableId', 8).first()
    const resultIds = await knex('Result').insert({
      resultSourceId: 1,
      resultTypeId: 1,
      partnerId,
      assayId,
      deviceId,
      sampleId: 1,
      reportableSiteId: 1,
      siteId: site.id,
      consumableLot: inventoryItem1.lotNumber,
      consumableExpirationDate: '2025-01-27 00:00:00',
      endedOn: new Date(),
    })
    ;[resultId1] = resultIds
  })

  after(async () => {
    await testContext.cleanUp()
  })

  afterEach(async () => {
    // Clean up inventory items and related records
    await knex('InventoryItem').where('id', '>=', inventoryItem1.id).delete()
    await knex('InventoryLog').where('siteId', site.id).delete()
    await knex('FactInventoryConsumptionRate').where('siteId', site.id).delete()
    await knex('Result').where('id', resultId1).delete()
  })

  it('should reset inventory', async () => {
    // Check reconciliationStartDate is null before reset
    const inventoryItemBefore = await knex('InventoryItem')
      .where({
        siteId: site.id,
        consumableId: 8,
        lotNumber: 'LOT001',
        expiresOn: '2025-01-27T00:00:00Z',
      })
      .first()
    assert.isNull(
      inventoryItemBefore.reconciliationStartDate,
      'Expected reconciliationStartDate to be null before reset'
    )

    const physicalCountConsumableReasonId = await consumableReasonToId('physical_count')

    const payload1 = {
      dateAdjusted: '2025-01-07T14:45:08.387Z',
      toSiteId: site.id,
      consumableId: 8,
      reasonId: physicalCountConsumableReasonId,
      quantity: 130,
      lotNumber: 'LOT001',
      expiresOn: '2025-01-27T00:00:00Z',
    }

    const res1 = await sendRequest(payload1)

    // Assert the inventory was reset to the specified quantity
    assertResponse(res1, 200, 130)

    const [inventoryLog] = await knex('InventoryLog')
      .where('consumableReasonId', physicalCountConsumableReasonId)
      .select()

    assert.equal(inventoryLog.quantity, -220, 'Expected inventoryLog.quantity to be -220')
    assert.equal(inventoryLog.quantityOnHandAfter, 130, 'Expected inventoryLog.quantityOnHandAfter to be 130')

    // Check reconciliationStartDate is not null after reset
    const inventoryItemAfter = await knex('InventoryItem')
      .where({
        siteId: site.id,
        consumableId: 8,
        lotNumber: 'LOT001',
        expiresOn: '2025-01-27T00:00:00Z',
      })
      .first()
    assert.isNotNull(
      inventoryItemAfter.reconciliationStartDate,
      'Expected reconciliationStartDate to be set after reset'
    )

    const data = await knex('Result')
      .where({
        id: resultId1,
        reconciliationDate: null,
      })
      .select()
    assert.equal(data.length, 0, 'Expected no missing inventory lots after reset')

    const manualAdditionConsumableReasonId = await consumableReasonToId('manual_addition')

    const payload2 = {
      dateAdjusted: '2025-01-07T14:45:08.387Z',
      toSiteId: site.id,
      consumableId: 8,
      reasonId: manualAdditionConsumableReasonId,
      quantity: 5,
      lotNumber: 'LOT001',
      expiresOn: '2025-01-27T00:00:00Z',
    }

    const res2 = await sendRequest(payload2)

    // Assert the second request returns 400 with reconciliationDateViolation error
    assert.equal(res2.status, 400, 'Expected status 400 for reconciliation date violation')
    assert.equal(
      res2.body.errorKeyCode,
      'reconciliationDateViolation',
      'Expected errorKeyCode to be reconciliationDateViolation'
    )

    const payload3 = {
      dateAdjusted: addHours(new Date(), 1).toISOString(),
      toSiteId: site.id,
      consumableId: 8,
      reasonId: manualAdditionConsumableReasonId,
      quantity: 5,
      lotNumber: 'LOT001',
      expiresOn: '2025-01-27T00:00:00Z',
    }

    const res3 = await sendRequest(payload3)

    assert.equal(res3.status, 200, 'Expected status 200')
    assert.equal(res3.body.data.quantityOnHand, 135, 'Expected quantityOnHand 135')
  })
})
