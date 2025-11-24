/* eslint-disable mocha/no-exclusive-tests */
const chai = require('chai')
const _ = require('lodash')
const addYears = require('date-fns/addYears')
const { addDays } = require('date-fns')
const shared = require('../utils/sharedToken')
const { getConstraints, addConstraints } = require('../../src/auth/constraints')
const { consumableReasonToId } = require('../../src/shared/dictionary')
const { knex } = require('../../src/db')

const { assert } = chai
const server = require('../utils/testUtils')
const { startOfDayUtc } = require('../../src/shared/date')
const { insertSite } = require('../../src/site/common/db')

describe('Inventory Routes With Expiration Date Strategy', () => {
  const getScopedSites = async () => {
    const dataConstraints = await getConstraints({ name: 'admin' })
    const [site1, site2] = await knex('Site as s')
      .join('SiteType as type', 's.siteTypeId', 'type.id')
      .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
      .leftOuterJoin('State as st', 'g.stateId', 'st.id')
      .leftOuterJoin('Country as ct', 'g.countryId', 'ct.id')
      .leftOuterJoin('Lga as l', 'g.lgaId', 'l.id')
      .modify(addConstraints, dataConstraints, {
        site: 's',
        geography: 'g',
      })
      .where('type.externalId', 'lab')
      .select('s.*')
    await insertSite(knex, [
      {
        ..._.omit(site1, 'id'),
        name: 'TEST SITE 1',
        externalId: 'testSite1',
      },
      {
        ..._.omit(site2, 'id'),
        name: 'TEST SITE 2',
        externalId: 'testSite2',
      },
    ])
    const newSites = await knex('Site').whereIn('externalId', ['testSite1', 'testSite2'])
    return newSites
  }

  describe('Inventory List Route', () => {
    describe('/inventory', () => {
      const path = '/api/inventory'
      let site1Id
      let site2Id
      let inventoryItem1Id
      let inventoryItem2Id
      let inventoryItem3Id
      let inventoryItem4Id
      let inventoryItem5Id
      let inventoryItemInTransitId
      let negativeQoHInventoryItemId
      let tbRifConsumableId
      const expiresOn1 = startOfDayUtc(addDays(new Date(), 1))
      const expiresOn2 = startOfDayUtc(addDays(new Date(), 2))
      const expiresOn3 = startOfDayUtc(addDays(new Date(), 50))

      before(async () => {
        shared.checkToken(server, path)
        ;[{ id: site1Id }, { id: site2Id }] = await getScopedSites()

        const { id: tbRconsumableId } = await knex('Consumable').where('externalId', 'GxMtbRifCartridge').first('id')
        tbRifConsumableId = tbRconsumableId
        // attach a different consumable to test ordering
        const { id: alereConsumableId } = await knex('Consumable')
          .where('externalId', 'AlereHivDetectCartridge')
          .first('id')

        ;[inventoryItem1Id] = await knex('InventoryItem').insert({
          consumableId: tbRifConsumableId,
          siteId: site1Id,
          lotNumber: 'SAMELOT1',
          expiresOn: expiresOn1,
          quantityOnHand: 250,
        })
        ;[inventoryItem2Id] = await knex('InventoryItem').insert({
          consumableId: tbRifConsumableId,
          siteId: site1Id,
          lotNumber: 'SAMELOT1',
          expiresOn: expiresOn2,
          quantityOnHand: 350,
        })
        ;[inventoryItem3Id] = await knex('InventoryItem').insert({
          consumableId: tbRifConsumableId,
          siteId: site1Id,
          lotNumber: 'SAMELOT2',
          expiresOn: expiresOn3,
          quantityOnHand: 300,
        })
        ;[inventoryItemInTransitId] = await knex('InventoryItem').insert({
          consumableId: tbRifConsumableId,
          siteId: site1Id,
          inTransitFromSiteId: site2Id,
          lotNumber: 'SAMELOT2',
          expiresOn: expiresOn2,
          quantityOnHand: 500,
        })

        const siteConsumables = [
          { siteId: site1Id, consumableId: tbRifConsumableId },
          { siteId: site2Id, consumableId: tbRifConsumableId },
          { siteId: site1Id, consumableId: alereConsumableId },
        ]
        await knex('SiteConsumable').insert(siteConsumables)
        await knex('FactInventoryConsumptionRate').insert({
          consumableId: tbRifConsumableId,
          siteId: site1Id,
          days: 1,
          rate: 200,
          updatedOn: new Date(),
        })
        ;[inventoryItem4Id] = await knex('InventoryItem').insert({
          consumableId: tbRifConsumableId,
          siteId: site1Id,
          lotNumber: 'SAMELOT1',
          expiresOn: expiresOn3,
          quantityOnHand: 300,
        })
        ;[inventoryItem5Id] = await knex('InventoryItem').insert({
          consumableId: tbRifConsumableId,
          siteId: site2Id,
          lotNumber: 'SAMELOT2',
          expiresOn: expiresOn3,
          quantityOnHand: 300,
        })
        ;[negativeQoHInventoryItemId] = await knex('InventoryItem').insert({
          consumableId: tbRifConsumableId,
          siteId: site2Id,
          lotNumber: '0000018',
          expiresOn: expiresOn3,
          quantityOnHand: -1,
        })
        await knex('FactInventoryConsumptionRate').insert({
          consumableId: tbRifConsumableId,
          siteId: site2Id,
          days: 1,
          rate: 5,
          updatedOn: new Date(),
        })

        await knex('Consumable').where('id', tbRifConsumableId).update({
          strategy: 'withExpirationDateStrategy',
        })
      })

      after(async () => {
        await knex('Consumable').where('id', tbRifConsumableId).update({
          strategy: 'withLotAndExpirationDateStrategy',
        })
        await knex('InventoryItem')
          .whereIn('id', [
            inventoryItem1Id,
            inventoryItem2Id,
            inventoryItem3Id,
            inventoryItemInTransitId,
            inventoryItem4Id,
            inventoryItem5Id,
            negativeQoHInventoryItemId,
          ])
          .delete()
        await knex('FactInventoryConsumptionRate').whereIn('siteId', [site1Id, site2Id]).delete()
        await knex('SiteConsumable').whereIn('siteId', [site1Id, site2Id]).delete()
        await knex('Site').whereIn('id', [site1Id, site2Id]).delete()
        await knex('SiteConsumable').whereIn('siteId', [site1Id, site2Id]).delete()
      })

      describe('GET', () => {
        it('should return a list of inventory items broken out by lot', async () => {
          const res = await server
            .get(`${path}?breakOutByLot=true&hasStock=true`)
            .set('Authorization', `Bearer ${shared.token}`)

          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.isAtLeast(res.body.data.length, 2)
          const inventoryItem0 = res.body.data[0]
          assert.property(inventoryItem0, 'id')
          assert.property(inventoryItem0, 'consumableId')
          assert.property(inventoryItem0, 'siteId')
          assert.property(inventoryItem0, 'expiresOn')
          assert.property(inventoryItem0, 'canExpire')
          assert.property(inventoryItem0, 'lotNumber')
          assert.property(inventoryItem0, 'quantityOnHand')
          assert.property(inventoryItem0, 'consumableName')
          assert.property(inventoryItem0, 'manufacturer')
          assert.property(inventoryItem0, 'unitShortName')
          assert.property(inventoryItem0, 'siteName')
          assert.property(inventoryItem0, 'countryId')
          assert.property(inventoryItem0, 'stateId')
          assert.property(inventoryItem0, 'lgaId')
          assert.property(inventoryItem0, 'countryName')
          assert.property(inventoryItem0, 'stateName')
          assert.property(inventoryItem0, 'lgaName')
          assert.property(inventoryItem0, 'inTransitFromSiteId')
          assert.notProperty(inventoryItem0, 'stockLeft')
          assert.notProperty(inventoryItem0, 'dailyConsumptionRate')

          const [inventoryItem1] = res.body.data.filter(
            ii =>
              ii.siteId === site1Id &&
              ii.consumableId === tbRifConsumableId &&
              ii.expiresOn === expiresOn3.toISOString()
          )
          assert.isNotNull(inventoryItem1)
          assert.equal(inventoryItem1.quantityOnHand, 300)

          const [inventoryItem2] = res.body.data.filter(
            ii =>
              ii.siteId === site1Id &&
              ii.consumableId === tbRifConsumableId &&
              ii.expiresOn === expiresOn1.toISOString()
          )
          assert.isNotNull(inventoryItem2)
          assert.equal(inventoryItem2.quantityOnHand, 250)

          assert.property(res.body, 'total')
        })

        it('should return a list of non zero inventory items broken out by lot', async () => {
          const res = await server
            .get(`${path}?breakOutByLot=true&hasStock=true`)
            .set('Authorization', `Bearer ${shared.token}`)

          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.isAtLeast(res.body.data.length, 2)
        })

        it('should return a list of inventory items, correctly calculate days stock left and stock to be wasted', async () => {
          const res = await server
            .get(`${path}?consumableId=${tbRifConsumableId}&siteName=test%20site`)
            .set('Authorization', `Bearer ${shared.token}`)
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          res.body.data.forEach(inventoryItem => {
            assert.property(inventoryItem, 'consumableId')
            assert.property(inventoryItem, 'siteId')
            assert.property(inventoryItem, 'canExpire')
            assert.property(inventoryItem, 'quantityOnHand')
            assert.property(inventoryItem, 'consumableName')
            assert.property(inventoryItem, 'manufacturer')
            assert.property(inventoryItem, 'unitShortName')
            assert.property(inventoryItem, 'siteName')
            assert.property(inventoryItem, 'countryId')
            assert.property(inventoryItem, 'stateId')
            assert.property(inventoryItem, 'lgaId')
            assert.property(inventoryItem, 'countryName')
            assert.property(inventoryItem, 'stateName')
            assert.property(inventoryItem, 'lgaName')
            assert.property(inventoryItem, 'daysStockLeft')
            assert.property(inventoryItem, 'dailyConsumptionRate')
            assert.property(inventoryItem, 'id')
            assert.notProperty(inventoryItem, 'lotNumber')
            assert.notProperty(inventoryItem, 'expiresOn')
            assert.notProperty(inventoryItem, 'inTransitFromSiteId')
            assert.notProperty(inventoryItem, 'inTransitFromSiteName')
          })

          const inventoryItems = res.body.data.filter(ii => ii.siteId === site1Id)

          // Only one row per site and consumable
          assert.equal(inventoryItems.length, 1)
          assert.isNotNull(inventoryItems[0])

          // Correct quantity - stock in transit should not be counted
          assert.equal(inventoryItems[0].quantityOnHand, 1200)

          // - We have 1200 cartridges
          // - 250 expiring tomorrow
          // - 500 expiring in two days
          // - 600 expiring in 50 days
          // - The consumption rate is 200 cartridges/day
          // So...
          // Day 1 - We use 200 from expiring tomorrow ===> 50 wasted
          // Day 2 - We use 200 from expiring in two days ===> 300 wasted
          // Day 3 - We use 200 from expiring in 50 days
          // Day 4 - We use 100 from expiring in 50 days ===> Everything consumed
          // ===> 5 days of stock left
          // ===> 200 cartridges to be wasted
          assert.equal(inventoryItems[0].daysStockLeft, 5)
          assert.equal(inventoryItems[0].projectedWaste, 200)
        })

        it('should return a list of inventory items, apply in-query ordering by consumable name', async () => {
          const res = await server
            .get(`${path}?siteName=test%20site&sortCol=consumableName`)
            .set('Authorization', `Bearer ${shared.token}`)

          const sortedData = res.body.data.sort((a, b) => a.consumableName.localeCompare(b.consumableName))
          assert.deepStrictEqual(sortedData, res.body.data)
        })

        it('should return a list of inventory items, apply post-processing ordering by days stock left', async () => {
          const res = await server
            .get(`${path}?sortCol=daysStockLeft&sortDir=desc`)
            .set('Authorization', `Bearer ${shared.token}`)
          // Site 2 has 5 days of stock left
          assert.equal(res.body.data[0].siteId, site2Id)
          // Site 2 has 5 days of stock left
          assert.equal(res.body.data[1].siteId, site1Id)
        })

        it.skip('should return a list of inventory items, apply post-processing ordering by stock to be wasted', async () => {
          const res = await server
            .get(`${path}?sortCol=projectedWaste&sortDir=desc`)
            .set('Authorization', `Bearer ${shared.token}`)

          // Site 1 will have 200 cartridges wasted
          assert.equal(res.body.data[0].siteId, site1Id)
          assert.equal(res.body.data[0].projectedWaste, 200)
          // Site 2 will have 50 cartridges wasted
          assert.equal(res.body.data[1].siteId, site2Id)
          assert.equal(res.body.data[1].projectedWaste, 50)
        })

        it('should return a list of inventory items, apply post-processing filtering by a range of days stock left', async () => {
          const res = await server.get(`${path}?daysStockLeft=upTo14`).set('Authorization', `Bearer ${shared.token}`)

          assert.equal(res.body.data.length, 1)
          // Site 1 has 3.5 days stock left, so it's between 1 and 14
          assert.equal(res.body.data[0].siteId, site1Id)
        })

        it('should return a list of inventory items, apply in-query filtering by never consumed inventory', async () => {
          const res = await server
            .get(`${path}?daysStockLeft=noConsumption`)
            .set('Authorization', `Bearer ${shared.token}`)
          res.body.data.forEach(d => assert.equal(d.dailyConsumptionRate ?? 0, 0))
        })

        it('should return a list of inventory items, apply in-query filtering by never recorded inventory', async () => {
          const res = await server
            .get(`${path}?daysStockLeft=notRecorded`)
            .set('Authorization', `Bearer ${shared.token}`)

          res.body.data.forEach(d => assert.equal(d.quantityOnHand, null))
        })

        it('should accept consumableId and siteName as query string parameters', async () => {
          const consumableId = 2
          const siteNameFilter = 'clinic'
          const res = await server
            .get(`${path}?consumableId=${consumableId}&siteName=${siteNameFilter}`)
            .set('Authorization', `Bearer ${shared.token}`)

          assert.equal(res.status, 200)
          res.body.data.forEach(inventoryItem => {
            assert.equal(inventoryItem.consumableId, consumableId)
            assert.include(inventoryItem.siteName.toLowerCase(), siteNameFilter.toLowerCase())
          })
        })
      })
    })

    describe('/inventory/days-by-location', () => {
      const path = '/api/inventory/days-by-location'
      before(() => {
        shared.checkToken(server, path)
      })

      describe('GET', () => {
        const assertAggregatedItem = item => {
          assert.property(item, 'consumableId')
          assert.property(item, 'consumableName')
          // counts
          assert.property(item, 'outOfStock')
          assert.property(item, 'upTo14')
          assert.property(item, 'upTo30')
          assert.property(item, 'upTo90')
          assert.property(item, 'upTo180')
          assert.property(item, 'moreThan180')
          assert.property(item, 'notRecorded')
          assert.property(item, 'noConsumption')
        }

        it('should return a list of sites with inventories counts, when using valid token', async () => {
          const res = await server.get(path).set('Authorization', `Bearer ${shared.token}`)

          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          res.body.data.forEach(item => assertAggregatedItem(item))
          assert.property(res.body, 'total')
        })

        it('should accept consumableId and siteName as query string parameters', async () => {
          const consumableId = 1
          const siteNameFilter = 'lab'
          const res = await server
            .get(`${path}?consumableId=${consumableId}&siteName=${siteNameFilter}`)
            .set('Authorization', `Bearer ${shared.token}`)

          assert.equal(res.status, 200)
          res.body.data.forEach(item => assertAggregatedItem(item))
        })
      })
    })
  })

  describe('Inventory Adjustments', () => {
    const consumableName = 'GeneXpert TB Cartridge'
    const quantityToAdjust = 11
    const initialQuantityOnHand = 500
    const testLotNumber = 'TEST-LOT'
    const addInventoryPath = '/api/inventory/add'
    const removeInventoryPath = '/api/inventory/remove'
    const transferInventoryPath = '/api/inventory/transfer'
    let inventoryItem
    let destinationSite
    let siteId
    let transitItem
    const inventoryItemsToRemove = []
    after(async () => {
      await knex('Consumable').update({
        strategy: 'withLotAndExpirationDateStrategy',
      })
    })
    before(async () => {
      await knex('Consumable').update({
        strategy: 'withExpirationDateStrategy',
      })
    })
    beforeEach(async () => {
      const { id: consumableId } = await knex('Consumable').where('name', consumableName).first('id')
      const dataConstraints = await getConstraints({ name: 'admin' })
      ;[{ id: siteId }, destinationSite] = await knex('Site as s')
        .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
        .leftOuterJoin('State as st', 'g.stateId', 'st.id')
        .leftOuterJoin('Country as ct', 'g.countryId', 'ct.id')
        .leftOuterJoin('Lga as l', 'g.lgaId', 'l.id')
        .modify(addConstraints, dataConstraints, {
          site: 's',
          geography: 'g',
        })
        .select('s.id')

      const expiryDate = new Date(addYears(new Date(), 1).setHours(0, 0, 0, 0))
      const [inventoryItemId] = await knex('InventoryItem').insert({
        consumableId,
        siteId,
        lotNumber: testLotNumber,
        expiresOn: expiryDate,
        quantityOnHand: initialQuantityOnHand,
      })
      inventoryItemsToRemove.push(inventoryItemId)
      inventoryItem = await knex('InventoryItem').where({ id: inventoryItemId }).first()
      assert.isOk(destinationSite, `Cannot find destinationSite`)
    })

    afterEach(async () => {
      const inventoryLogsToRemove = await knex('InventoryLog')
        .whereIn('inventoryItemId', inventoryItemsToRemove)
        .orWhere(function () {
          if (transitItem != null) {
            this.where({ inventoryItemId: transitItem.id })
          }
        })
        .pluck('id')
      await knex('InventoryTransfer')
        .whereIn('outcomeInventoryLogId', inventoryLogsToRemove)
        .orWhereIn('incomeInventoryLogId', inventoryLogsToRemove)
        .orWhereIn('tempInventoryItemId', inventoryItemsToRemove)
        .delete()
      await knex('InventoryLog').whereIn('id', inventoryLogsToRemove).delete()
      await knex('InventoryItem')
        .whereIn('id', inventoryItemsToRemove)
        .orWhere(function () {
          if (transitItem != null) {
            this.where({ id: transitItem.id })
          }
        })
        .delete()
    })

    describe('/inventory/add', () => {
      describe('PUT', () => {
        it('should update the quantity of an inventory item with lot serial number and expirationDate', async () => {
          const res = await server
            .put(`${addInventoryPath}`)
            .send({
              consumableId: inventoryItem.consumableId,
              lotNumber: inventoryItem.lotNumber,
              expiresOn: inventoryItem.expiresOn,
              reasonId: await consumableReasonToId('manual_addition'),
              quantity: quantityToAdjust,
              notes: 'Testing add',
              toSiteId: inventoryItem.siteId,
              dateAdjusted: new Date().toISOString(),
            })
            .set('Authorization', `Bearer ${shared.token}`)
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'Object')
          assert.equal(res.body.data.quantityOnHand, inventoryItem.quantityOnHand + quantityToAdjust)
          assert.equal(res.body.data.lotNumber, inventoryItem.lotNumber)
        })
      })
      describe('PUT', () => {
        before(async () => knex('Partner').update({ inventoryStrategy: 'withExpirationDateStrategy' }))
        after(async () =>
          knex('Partner').update({
            inventoryStrategy: 'withLotAndExpirationDateStrategy',
          })
        )
      })
    })

    describe('/inventory/remove', () => {
      describe('PUT', () => {
        it('should update the quantity of an inventory item', async () => {
          const res = await server
            .put(`${removeInventoryPath}`)
            .send({
              consumableId: inventoryItem.consumableId,
              lotNumber: inventoryItem.lotNumber,
              expiresOn: inventoryItem.expiresOn,
              quantity: 400,
              notes: 'Testing remove',
              fromSiteId: inventoryItem.siteId,
              reasonId: await consumableReasonToId('lost'),
              dateAdjusted: new Date().toISOString(),
            })
            .set('Authorization', `Bearer ${shared.token}`)

          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'Object')
          assert.equal(res.body.data.quantityOnHand, inventoryItem.quantityOnHand - 400)
        })
        it('should not create a new inventory item and set the quantity if the expiration date is different', async () => {
          const res = await server
            .put(`${removeInventoryPath}`)
            .send({
              consumableId: inventoryItem.consumableId,
              lotNumber: 'ANOTHER LOT NUMBER',
              expiresOn: addDays(inventoryItem.expiresOn, 1),
              quantity: 510,
              notes: 'Testing remove',
              fromSiteId: inventoryItem.siteId,
              reasonId: await consumableReasonToId('lost'),
              dateAdjusted: new Date().toISOString(),
            })
            .set('Authorization', `Bearer ${shared.token}`)

          assert.equal(res.status, 400)
          assert.equal(res.body.errorKeyCode, 'missingInventoryItem')
        })
      })
    })

    describe('/inventory/transfer', () => {
      describe('PUT', () => {
        it('should add an inventory item to the destination site, transfer must identify the right Inventory Item', async () => {
          let res = await server
            .put(`${transferInventoryPath}`)
            .send({
              consumableId: inventoryItem.consumableId,
              lotNumber: inventoryItem.lotNumber,
              expiresOn: inventoryItem.expiresOn,
              quantity: quantityToAdjust,
              notes: 'Testing transfer',
              fromSiteId: inventoryItem.siteId,
              toSiteId: destinationSite.id,
              dateAdjusted: new Date().toISOString(),
            })
            .set('Authorization', `Bearer ${shared.token}`)

          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'Object')
          assert.equal(
            res.body.data.existingInventoryItem.quantityOnHand,
            inventoryItem.quantityOnHand - quantityToAdjust
          )
          transitItem = res.body.data.newInventoryItem
          inventoryItemsToRemove.push(res.body.data.newInventoryItem.id)
          assert.deepEqual(transitItem, {
            ...transitItem,
            quantityOnHand: quantityToAdjust,
            inTransitFromSiteId: null,
            siteId: destinationSite.id,
            lotNumber: inventoryItem.lotNumber,
            expiresOn: inventoryItem.expiresOn.toISOString(),
          })
          // a second transfer of the same lot
          res = await server
            .put(`${transferInventoryPath}`)
            .send({
              consumableId: inventoryItem.consumableId,
              lotNumber: inventoryItem.lotNumber,
              expiresOn: inventoryItem.expiresOn,
              quantity: quantityToAdjust,
              notes: 'Testing transfer existing inventory item',
              fromSiteId: inventoryItem.siteId,
              toSiteId: destinationSite.id,
              dateAdjusted: new Date().toISOString(),
            })
            .set('Authorization', `Bearer ${shared.token}`)

          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'Object')
          assert.equal(
            res.body.data.existingInventoryItem.quantityOnHand,
            inventoryItem.quantityOnHand - quantityToAdjust * 2
          )
          const targetInventoryItem = res.body.data.newInventoryItem
          assert.equal(targetInventoryItem.id, transitItem.id)
          assert.deepEqual(targetInventoryItem, {
            ...targetInventoryItem,
            quantityOnHand: transitItem.quantityOnHand + quantityToAdjust,
            inTransitFromSiteId: null,
            siteId: destinationSite.id,
            lotNumber: inventoryItem.lotNumber,
            expiresOn: inventoryItem.expiresOn.toISOString(),
          })
        })
      })
    })
  })
})
