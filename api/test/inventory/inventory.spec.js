const chai = require('chai')
const _ = require('lodash')
const addYears = require('date-fns/addYears')
const { addDays } = require('date-fns')
const shared = require('../utils/sharedToken')
const { run } = require('../../src/db')
const { getConstraints, addConstraints } = require('../../src/auth/constraints')
const { knex } = require('../../src/db')

const { assert } = chai
const server = require('../utils/testUtils')
const { startOfDayUtc } = require('../../src/shared/date')

describe('Inventory Routes', () => {
  const getScopedSites = async () => {
    const dataConstraints = await getConstraints({ name: 'admin' })
    const [site1, site2] = await knex('Site as s')
      .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
      .leftOuterJoin('State as st', 'g.stateId', 'st.id')
      .leftOuterJoin('Country as ct', 'g.countryId', 'ct.id')
      .leftOuterJoin('Lga as l', 'g.lgaId', 'l.id')
      .modify(addConstraints, dataConstraints, {
        site: 's',
        geography: 'g',
      })
      .select('s.*')
    await knex('Site').insert([
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
    const newSites = await knex('Site').whereIn('externalId', [
      'testSite1',
      'testSite2',
    ])
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
      let inventoryItemInTransitId
      let consumableId
      const expiresOn1 = startOfDayUtc(addDays(new Date(), 1))
      const expiresOn2 = startOfDayUtc(addDays(new Date(), 2))
      const expiresOn3 = startOfDayUtc(addDays(new Date(), 50))

      before(async () => {
        shared.checkToken(server, path)
        ;[{ id: site1Id }, { id: site2Id }] = await getScopedSites()
        const { id } = await knex('Consumable')
          .where('name', 'GeneXpert TB Cartridge')
          .first('id')
        consumableId = id
        ;[inventoryItem1Id] = await knex('InventoryItem').insert({
          consumableId,
          siteId: site1Id,
          lotNumber: '0000001',
          expiresOn: expiresOn1,
          quantityOnHand: 250,
        })
        ;[inventoryItem2Id] = await knex('InventoryItem').insert({
          consumableId,
          siteId: site1Id,
          lotNumber: '0000002',
          expiresOn: expiresOn2,
          quantityOnHand: 350,
        })
        ;[inventoryItem3Id] = await knex('InventoryItem').insert({
          consumableId,
          siteId: site1Id,
          lotNumber: '0000003',
          expiresOn: expiresOn3,
          quantityOnHand: 300,
        })
        ;[inventoryItemInTransitId] = await knex('InventoryItem').insert({
          consumableId,
          siteId: site1Id,
          inTransitFromSiteId: site2Id,
          lotNumber: '0000002',
          expiresOn: expiresOn2,
          quantityOnHand: 500,
        })
        await knex('FactInventoryConsumptionRate').insert({
          siteId: site1Id,
          consumableId,
          days: 1,
          rate: 200,
          updatedOn: new Date(),
        })
        ;[inventoryItem4Id] = await knex('InventoryItem').insert({
          consumableId,
          siteId: site2Id,
          lotNumber: '0000003',
          expiresOn: expiresOn3,
          quantityOnHand: 300,
        })
        await knex('FactInventoryConsumptionRate').insert({
          siteId: site2Id,
          consumableId,
          days: 1,
          rate: 5,
          updatedOn: new Date(),
        })
      })

      after(async () => {
        await knex('InventoryItem')
          .whereIn('id', [
            inventoryItem1Id,
            inventoryItem2Id,
            inventoryItem3Id,
            inventoryItemInTransitId,
            inventoryItem4Id,
          ])
          .delete()
        await knex('FactInventoryConsumptionRate')
          .whereIn('siteId', [site1Id, site2Id])
          .delete()
        await knex('Site').whereIn('id', [site1Id, site2Id]).delete()
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
          res.body.data.forEach(inventoryItem => {
            assert.property(inventoryItem, 'id')
            assert.property(inventoryItem, 'consumableId')
            assert.property(inventoryItem, 'siteId')
            assert.property(inventoryItem, 'expiresOn')
            assert.property(inventoryItem, 'canExpire')
            assert.property(inventoryItem, 'lotNumber')
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
            assert.property(inventoryItem, 'inTransitFromSiteId')
            assert.property(inventoryItem, 'inTransitFromSiteName')
            assert.notProperty(inventoryItem, 'stockLeft')
            assert.notProperty(inventoryItem, 'dailyConsumptionRate')
          })

          const [inventoryItem1] = res.body.data.filter(
            ii =>
              ii.siteId === site1Id &&
              ii.consumableId === consumableId &&
              ii.lotNumber === '0000001' &&
              ii.expiresOn === expiresOn1.toISOString()
          )
          assert.isNotNull(inventoryItem1)
          assert.equal(inventoryItem1.quantityOnHand, 250)

          const [inventoryItem2] = res.body.data.filter(
            ii =>
              ii.siteId === site1Id &&
              ii.consumableId === consumableId &&
              ii.lotNumber === '0000002' &&
              ii.expiresOn === expiresOn2.toISOString() &&
              ii.inTransitFromSiteId === null
          )
          assert.isNotNull(inventoryItem2)
          assert.equal(inventoryItem2.quantityOnHand, 350)

          const [inventoryItemInTransit] = res.body.data.filter(
            ii =>
              ii.siteId === site1Id &&
              ii.consumableId === consumableId &&
              ii.lotNumber === '0000002' &&
              ii.expiresOn === expiresOn2.toISOString() &&
              ii.inTransitFromSiteId !== null
          )
          assert.isNotNull(inventoryItemInTransit)
          assert.equal(inventoryItemInTransit.quantityOnHand, 500)

          // We should filter empty or negative inventories
          const emptyInventoryItems = res.body.data.filter(
            ii => ii.quantityOnHand <= 0
          )
          assert.isFalse(emptyInventoryItems.length > 0)

          assert.property(res.body, 'total')
        })

        it('should return a list of positive inventory items broken out by lot', async () => {
          const res = await server
            .get(`${path}?breakOutByLot=true&hasStock=true`)
            .set('Authorization', `Bearer ${shared.token}`)

          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.isAtLeast(res.body.data.length, 2)

          // We should not filter empty or negative inventories
          const emptyInventoryItems = res.body.data.filter(
            ii => ii.quantityOnHand <= 0
          )
          assert.isTrue(emptyInventoryItems.length === 0)
        })

        it('should return a list of inventory items, correctly calculate days stock left and stock to be wasted', async () => {
          const res = await server
            .get(`${path}`)
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

          assert.equal(res.status, 200)

          const inventoryItems = res.body.data.filter(
            ii => ii.siteId === site1Id && ii.consumableId === consumableId
          )

          // Only one row per site and consumable
          assert.equal(inventoryItems.length, 1)
          assert.isNotNull(inventoryItems[0])

          // Correct quantity - stock in transit should not be counted
          assert.equal(inventoryItems[0].quantityOnHand, 900)

          // - We have 900 cartridges
          // - 250 expiring tomorrow (inclusive)
          // - 350 expiring in two days (inclusive)
          // - 300 expiring in 50 days (inclusive)
          // - The consumption rate is 200 cartridges/day
          // So...
          // Day 1 - We use 200 from expiring tomorrow ===> 50 wasted
          // Day 2 - We use 200 from expiring in two days ===> 150 wasted
          // Day 3 - We use 200 from expiring in 50 days
          // Day 4 - We use 100 from expiring in 50 days ===> Everything consumed
          // ===> 3.5 days of stock left
          // ===> 200 cartridges to be wasted
          assert.equal(inventoryItems[0].daysStockLeft, 3.5)
          assert.equal(inventoryItems[0].projectedWaste, 200)
        })

        it('should return a list of inventory items, apply in-query ordering by consumable name', async () => {
          const res = await server
            .get(`${path}?sortCol=consumableName`)
            .set('Authorization', `Bearer ${shared.token}`)

          assert.equal(
            res.body.data[0].consumableName,
            res.body.data[1].consumableName
          )
          assert.isTrue(
            res.body.data[0].consumableName <
              res.body.data[res.body.data.length - 1].consumableName
          )
        })

        it('should return a list of inventory items, apply post-processing ordering by days stock left', async () => {
          const res = await server
            .get(`${path}?sortCol=daysStockLeft&sortDir=desc`)
            .set('Authorization', `Bearer ${shared.token}`)

          // Site 2 has 50 days of stock left
          assert.equal(res.body.data[0].siteId, site2Id)
          // Site 1 has 3.5 days of stock left
          assert.equal(res.body.data[1].siteId, site1Id)
        })

        it('should return a list of inventory items, apply post-processing ordering by stock to be wasted', async () => {
          const res = await server
            .get(`${path}?sortCol=projectedWaste&sortDir=desc`)
            .set('Authorization', `Bearer ${shared.token}`)

          // Site 1 will have 200 cartridges wasted
          assert.equal(res.body.data[0].siteId, site1Id)
          // Site 2 will have 50 cartridges wasted
          assert.equal(res.body.data[1].siteId, site2Id)
        })

        it('should return a list of inventory items, apply post-processing filtering by a range of days stock left', async () => {
          const res = await server
            .get(`${path}?daysStockLeft=upTo14`)
            .set('Authorization', `Bearer ${shared.token}`)

          assert.equal(res.body.data.length, 1)
          // Site 1 has 3.5 days stock left, so it's between 1 and 14
          assert.equal(res.body.data[0].siteId, site1Id)
        })

        it('should return a list of inventory items, apply in-query filtering by never consumed inventory', async () => {
          const res = await server
            .get(`${path}?daysStockLeft=noConsumption`)
            .set('Authorization', `Bearer ${shared.token}`)

          res.body.data.forEach(d =>
            assert.equal(d.dailyConsumptionRate ?? 0, 0)
          )
        })

        it('should return a list of inventory items, apply in-query filtering by never recorded inventory', async () => {
          const res = await server
            .get(`${path}?daysStockLeft=notRecorded`)
            .set('Authorization', `Bearer ${shared.token}`)

          res.body.data.forEach(d => assert.equal(d.quantityOnHand, null))
        })

        it('should accept consumableId and siteName as query string parameters', done => {
          const consumableId = 2
          const siteNameFilter = 'clinic'
          server
            .get(
              `${path}?consumableId=${consumableId}&siteName=${siteNameFilter}`
            )
            .set('Authorization', `Bearer ${shared.token}`)
            .end((err, res) => {
              assert.equal(res.status, 200)
              res.body.data.forEach(inventoryItem => {
                assert.equal(inventoryItem.consumableId, consumableId)
                assert.includes(
                  inventoryItem.siteName.toLowerCase(),
                  siteNameFilter.toLowerCase()
                )
              })
              done()
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

        it('should return a list of sites with inventories counts, when using valid token', done => {
          server
            .get(path)
            .set('Authorization', `Bearer ${shared.token}`)
            .end((err, res) => {
              assert.equal(res.status, 200)
              assert.typeOf(res.body, 'Object')
              assert.property(res.body, 'data')
              assert.typeOf(res.body.data, 'array')
              res.body.data.forEach(item => assertAggregatedItem(item))
              assert.property(res.body, 'total')
              done()
            })
        })

        it('should accept consumableId and siteName as query string parameters', done => {
          const consumableId = 1
          const siteNameFilter = 'lab'
          server
            .get(
              `${path}?consumableId=${consumableId}&siteName=${siteNameFilter}`
            )
            .set('Authorization', `Bearer ${shared.token}`)
            .end((err, res) => {
              assert.equal(res.status, 200)
              res.body.data.forEach(item => assertAggregatedItem(item))
              done()
            })
        })
      })
    })
  })

  describe('Inventory Adjustments', () => {
    const consumableName = 'GeneXpert TB Cartridge'
    const quantityToAdjust = 11
    const initialQuantityOnHand = 500
    const testLotNumber = 'TEST-LOT'
    // const getAllInventoryPath = '/api/inventory/group-by-site'
    const addInventoryPath = '/api/inventory/add'
    const removeInventoryPath = '/api/inventory/remove'
    const transferInventoryPath = '/api/inventory/transfer'
    const receiveInventoryPath = '/api/inventory/receive'
    let inventoryItem
    let destinationSite
    let siteId
    let transitItem
    const inventoryItemsToRemove = []

    beforeEach(() =>
      run(async knex => {
        const { id: consumableId } = await knex('Consumable')
          .where('name', consumableName)
          .first('id')
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

        const expiryDate = new Date(
          addYears(new Date(), 1).setHours(0, 0, 0, 0)
        )
        const [inventoryItemId] = await knex('InventoryItem').insert({
          consumableId,
          siteId,
          lotNumber: testLotNumber,
          expiresOn: expiryDate,
          quantityOnHand: initialQuantityOnHand,
        })
        inventoryItemsToRemove.push(inventoryItemId)
        inventoryItem = await knex('InventoryItem')
          .where({ id: inventoryItemId })
          .first()
        assert.isOk(destinationSite, `Cannot find destinationSite`)
      })
    )

    afterEach(async () =>
      run(async knex => {
        await knex('InventoryLog')
          .whereIn('inventoryItemId', inventoryItemsToRemove)
          .orWhere(function () {
            if (transitItem != null) {
              this.where({ inventoryItemId: transitItem.id })
            }
          })
          .delete()
        await knex('InventoryItem')
          .whereIn('id', inventoryItemsToRemove)
          .orWhere(function () {
            if (transitItem != null) {
              this.where({ id: transitItem.id })
            }
          })
          .delete()
      })
    )

    describe('/inventory/add', () => {
      describe('PUT', () => {
        it('should update the quantity of an inventory item', done => {
          server
            .put(`${addInventoryPath}`)
            .send({
              consumableId: inventoryItem.consumableId,
              lotNumber: inventoryItem.lotNumber,
              expiresOn: inventoryItem.expiresOn,
              quantity: quantityToAdjust,
              notes: 'Testing add',
              toSiteId: inventoryItem.siteId,
              dateAdjusted: new Date().toISOString(),
            })
            .set('Authorization', `Bearer ${shared.token}`)
            .end((err, res) => {
              assert.equal(res.status, 200)
              assert.typeOf(res.body, 'Object')
              assert.property(res.body, 'data')
              assert.typeOf(res.body.data, 'Object')
              assert.equal(
                res.body.data.quantityOnHand,
                _.max([0, inventoryItem.quantityOnHand + quantityToAdjust])
              )
              done()
            })
        })
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
              quantity: 510,
              notes: 'Testing remove',
              fromSiteId: inventoryItem.siteId,
              reasonId: 1,
              dateAdjusted: new Date().toISOString(),
            })
            .set('Authorization', `Bearer ${shared.token}`)
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'Object')
          assert.equal(
            res.body.data.quantityOnHand,
            inventoryItem.quantityOnHand - 510
          )
        })

        it('should create a new inventory item and set the quantity if the lot does not exist', async () => {
          const res = await server
            .put(`${removeInventoryPath}`)
            .send({
              consumableId: inventoryItem.consumableId,
              lotNumber: 'ANOTHER LOT NUMBER',
              expiresOn: inventoryItem.expiresOn,
              quantity: 510,
              notes: 'Testing remove',
              fromSiteId: inventoryItem.siteId,
              reasonId: 1,
              dateAdjusted: new Date().toISOString(),
            })
            .set('Authorization', `Bearer ${shared.token}`)
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'Object')
          assert.equal(res.body.data.quantityOnHand, -510)
          inventoryItemsToRemove.push(res.body.data.id)
        })
      })
    })

    describe('/inventory/transfer', () => {
      describe('PUT', () => {
        it('should add an inventory item in transit to the destination site', done => {
          server
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
            .end((err, res) => {
              assert.equal(res.status, 200)
              assert.typeOf(res.body, 'Object')
              assert.property(res.body, 'data')
              assert.typeOf(res.body.data, 'Object')
              assert.equal(
                res.body.data.existingInventoryItem.quantityOnHand,
                _.max([0, inventoryItem.quantityOnHand - quantityToAdjust])
              )
              transitItem = res.body.data.newInventoryItem
              inventoryItemsToRemove.push(res.body.data.newInventoryItem.id)
              assert.deepEqual(transitItem, {
                ...transitItem,
                quantityOnHand: _.max([0, quantityToAdjust]),
                inTransitFromSiteId: inventoryItem.siteId,
                siteId: destinationSite.id,
                lotNumber: inventoryItem.lotNumber,
                expiresOn: inventoryItem.expiresOn.toISOString(),
              })

              server
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
                .end((err, res) => {
                  assert.equal(res.status, 200)
                  assert.typeOf(res.body, 'Object')
                  assert.property(res.body, 'data')
                  assert.typeOf(res.body.data, 'Object')
                  assert.equal(
                    res.body.data.existingInventoryItem.quantityOnHand,
                    _.max([
                      0,
                      inventoryItem.quantityOnHand - quantityToAdjust * 2,
                    ])
                  )
                  const updatedTransitItem = res.body.data.newInventoryItem
                  assert.deepEqual(updatedTransitItem, {
                    ...updatedTransitItem,
                    quantityOnHand: _.max([
                      0,
                      transitItem.quantityOnHand + quantityToAdjust,
                    ]),
                    inTransitFromSiteId: inventoryItem.siteId,
                    siteId: destinationSite.id,
                    lotNumber: inventoryItem.lotNumber,
                    expiresOn: inventoryItem.expiresOn.toISOString(),
                  })
                  done()
                })
            })
        })

        it('when transfering from a non-existing lot, should add an inventory item in transit to the destination and another with negative stock in the origin site', async () => {
          const res = await server
            .put(`${transferInventoryPath}`)
            .send({
              consumableId: inventoryItem.consumableId,
              lotNumber: 'NON-EXISTING LOT',
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

          transitItem = res.body.data.newInventoryItem
          inventoryItemsToRemove.push(res.body.data.newInventoryItem.id)

          const sourceInventoryItem = res.body.data.existingInventoryItem
          inventoryItemsToRemove.push(sourceInventoryItem.id)

          assert.deepEqual(transitItem, {
            ...transitItem,
            quantityOnHand: quantityToAdjust,
            inTransitFromSiteId: inventoryItem.siteId,
            siteId: destinationSite.id,
            lotNumber: 'NON-EXISTING LOT',
            expiresOn: inventoryItem.expiresOn.toISOString(),
          })

          assert.deepEqual(sourceInventoryItem, {
            ...sourceInventoryItem,
            quantityOnHand: -quantityToAdjust,
            siteId: inventoryItem.siteId,
            lotNumber: 'NON-EXISTING LOT',
            expiresOn: inventoryItem.expiresOn.toISOString(),
          })
        })
      })
    })

    describe('/inventory/receive', () => {
      describe('PUT', () => {
        let receivedItem
        afterEach(async () =>
          run(async knex => {
            await knex('InventoryLog')
              .where({ inventoryItemId: receivedItem.id })
              .delete()
            await knex('InventoryItem').where({ id: receivedItem.id }).delete()
          })
        )

        it('should add an inventory item to the site', done => {
          server
            .put(`${transferInventoryPath}`)
            .send({
              consumableId: inventoryItem.consumableId,
              lotNumber: inventoryItem.lotNumber,
              expiresOn: inventoryItem.expiresOn,
              quantity: quantityToAdjust,
              notes: 'Creating a transfer to test receiving an item',
              fromSiteId: inventoryItem.siteId,
              toSiteId: destinationSite.id,
              dateAdjusted: new Date().toISOString(),
            })
            .set('Authorization', `Bearer ${shared.token}`)
            .end((err, res) => {
              assert.equal(res.status, 200)
              transitItem = res.body.data.newInventoryItem
              server
                .put(`${receiveInventoryPath}`)
                .send({
                  consumableId: transitItem.consumableId,
                  lotNumber: transitItem.lotNumber,
                  expiresOn: transitItem.expiresOn,
                  quantity: transitItem.quantityOnHand,
                  notes: 'Testing receiving a lot in transit',
                  fromSiteId: inventoryItem.siteId,
                  toSiteId: destinationSite.id,
                  dateAdjusted: new Date().toISOString(),
                })
                .set('Authorization', `Bearer ${shared.token}`)
                .end((err, res) => {
                  assert.equal(res.status, 200)
                  assert.typeOf(res.body, 'Object')
                  receivedItem = res.body.data
                  assert.deepEqual(receivedItem, {
                    ...res.body.data,
                    quantityOnHand: _.max([0, quantityToAdjust]),
                    siteId: destinationSite.id,
                    lotNumber: inventoryItem.lotNumber,
                    expiresOn: inventoryItem.expiresOn.toISOString(),
                  })
                  done()
                })
            })
        })
      })
    })
  })
})
