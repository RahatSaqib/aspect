const supertest = require('supertest')
const chai = require('chai')
const _ = require('lodash')
const addYears = require('date-fns/addYears')

const shared = require('../utils/sharedToken')
const { run } = require('../../src/db')
const { getConstraints, addConstraints } = require('../../src/auth/constraints')

const { assert } = chai
const server = supertest.agent('http://localhost:8080')

describe('Inventory Routes', () => {
  describe('Inventory List Route', () => {
    describe('/inventory', () => {
      const path = '/api/inventory'

      describe('GET', () => {
        shared.checkToken(server, path)

        it('should return a list of inventory items when using valid token', done => {
          server
            .get(path)
            .set('Authorization', `Bearer ${shared.token}`)
            .end((err, res) => {
              assert.equal(res.status, 200)
              assert.typeOf(res.body, 'Object')
              assert.property(res.body, 'data')
              assert.typeOf(res.body.data, 'array')
              assert.equal(res.body.data.length, 2)
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
              })
              assert.property(res.body, 'total')
              done()
            })
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

    describe('/inventory/group-by-site', () => {
      const path = '/api/inventory/group-by-site'

      describe('GET', () => {
        shared.checkToken(server, path)

        it('should return a list of sites, each with a list of inventory items, when using valid token', done => {
          server
            .get(path)
            .set('Authorization', `Bearer ${shared.token}`)
            .end((err, res) => {
              assert.equal(res.status, 200)
              assert.typeOf(res.body, 'Object')
              assert.property(res.body, 'data')
              assert.typeOf(res.body.data, 'array')
              assert.equal(res.body.data.length, 2)
              res.body.data.forEach(site => {
                assert.property(site, 'siteId')
                assert.property(site, 'siteName')
                assert.property(site, 'countryId')
                assert.property(site, 'stateId')
                assert.property(site, 'lgaId')
                assert.property(site, 'countryName')
                assert.property(site, 'stateName')
                assert.property(site, 'lgaName')
                assert.property(site, 'inventoryItems')
                site.inventoryItems.forEach(inventoryItem => {
                  assert.property(inventoryItem, 'id')
                  assert.property(inventoryItem, 'consumableId')
                  assert.property(inventoryItem, 'expiresOn')
                  assert.property(inventoryItem, 'canExpire')
                  assert.property(inventoryItem, 'lotNumber')
                  assert.property(inventoryItem, 'quantityOnHand')
                  assert.property(inventoryItem, 'consumableName')
                  assert.property(inventoryItem, 'manufacturer')
                  assert.property(inventoryItem, 'unitShortName')
                })
              })
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
              res.body.data.forEach(site => {
                assert.includes(
                  site.siteName.toLowerCase(),
                  siteNameFilter.toLowerCase()
                )
                site.inventoryItems.forEach(inventoryItem => {
                  assert.equal(inventoryItem.consumableId, consumableId)
                })
              })
              done()
            })
        })
      })
    })

    describe('/inventory/days-by-location', () => {
      const path = '/api/inventory/days-by-location'

      describe('GET', () => {
        shared.checkToken(server, path)

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
    const getAllInventoryPath = '/api/inventory/group-by-site'
    const addInventoryPath = '/api/inventory/add'
    const removeInventoryPath = '/api/inventory/remove'
    const transferInventoryPath = '/api/inventory/transfer'
    const receiveInventoryPath = '/api/inventory/receive'
    let inventoryItem
    let destinationSite
    let siteId
    let transitItem

    beforeEach(async () =>
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
        inventoryItem = await knex('InventoryItem')
          .where({ id: inventoryItemId })
          .first()
        assert.isOk(destinationSite, `Cannot find destinationSite`)
      })
    )

    afterEach(async () =>
      run(async knex => {
        await knex('InventoryLog')
          .where({ inventoryItemId: inventoryItem.id })
          .orWhere(function() {
            if (transitItem != null) {
              this.where({ inventoryItemId: transitItem.id })
            }
          })
          .delete()
        await knex('InventoryItem')
          .where({ id: inventoryItem.id })
          .orWhere(function() {
            if (transitItem != null) {
              this.where({ id: transitItem.id })
            }
          })
          .delete()
      })
    )

    describe('/inventory/add/{inventoryItemId}', () => {
      describe('PUT', () => {
        it('should update the quantity of an inventory item', done => {
          server
            .put(`${addInventoryPath}/${inventoryItem.id}`)
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

    describe('/inventory/remove/{inventoryItemId}', () => {
      describe('PUT', () => {
        it('should update the quantity of an inventory item', done => {
          server
            .put(`${removeInventoryPath}/${inventoryItem.id}`)
            .send({
              consumableId: inventoryItem.consumableId,
              lotNumber: inventoryItem.lotNumber,
              expiresOn: inventoryItem.expiresOn,
              quantity: quantityToAdjust,
              notes: 'Testing remove',
              fromSiteId: inventoryItem.siteId,
              reasonId: 1,
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
                _.max([0, inventoryItem.quantityOnHand - quantityToAdjust])
              )
              done()
            })
        })

        it('should remove the inventory item from view quantity is zero', done => {
          server
            .put(`${removeInventoryPath}/${inventoryItem.id}`)
            .send({
              consumableId: inventoryItem.consumableId,
              lotNumber: inventoryItem.lotNumber,
              expiresOn: inventoryItem.expiresOn,
              quantity: inventoryItem.quantityOnHand,
              notes: 'Testing removal of all inventory on hand',
              fromSiteId: inventoryItem.siteId,
              reasonId: 1,
              dateAdjusted: new Date().toISOString(),
            })
            .set('Authorization', `Bearer ${shared.token}`)
            .end((err, res) => {
              assert.equal(res.status, 200)
              server
                .get(getAllInventoryPath)
                .set('Authorization', `Bearer ${shared.token}`)
                .end((err, res) => {
                  assert.isFalse(
                    _.some(res.body.data, site =>
                      _.some(site.inventoryItems, {
                        id: inventoryItem.id,
                      })
                    )
                  )
                  done()
                })
            })
        })
      })
    })

    describe('/inventory/transfer/{inventoryItemId}', () => {
      describe('PUT', () => {
        it('should add an inventory item in transit to the destination site', done => {
          server
            .put(`${transferInventoryPath}/${inventoryItem.id}`)
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
              assert.deepEqual(
                transitItem,
                Object.assign({}, transitItem, {
                  quantityOnHand: _.max([0, quantityToAdjust]),
                  inTransitFromSiteId: inventoryItem.siteId,
                  siteId: destinationSite.id,
                  lotNumber: inventoryItem.lotNumber,
                  expiresOn: inventoryItem.expiresOn.toISOString(),
                })
              )

              server
                .put(`${transferInventoryPath}/${inventoryItem.id}`)
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
                  assert.deepEqual(
                    updatedTransitItem,
                    Object.assign({}, updatedTransitItem, {
                      quantityOnHand: _.max([
                        0,
                        transitItem.quantityOnHand + quantityToAdjust,
                      ]),
                      inTransitFromSiteId: inventoryItem.siteId,
                      siteId: destinationSite.id,
                      lotNumber: inventoryItem.lotNumber,
                      expiresOn: inventoryItem.expiresOn.toISOString(),
                    })
                  )
                  done()
                })
            })
        })
      })
    })

    describe('/inventory/receive/{inventoryItemId}', () => {
      describe('PUT', () => {
        let receivedItem
        afterEach(async () =>
          run(async knex => {
            await knex('InventoryLog')
              .where({ inventoryItemId: receivedItem.id })
              .delete()
            await knex('InventoryItem')
              .where({ id: receivedItem.id })
              .delete()
          })
        )

        it('should add an inventory item to the site', done => {
          server
            .put(`${transferInventoryPath}/${inventoryItem.id}`)
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
                .put(`${receiveInventoryPath}/${transitItem.id}`)
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
                  assert.deepEqual(
                    receivedItem,
                    Object.assign({}, res.body.data, {
                      quantityOnHand: _.max([0, quantityToAdjust]),
                      siteId: destinationSite.id,
                      lotNumber: inventoryItem.lotNumber,
                      expiresOn: inventoryItem.expiresOn.toISOString(),
                    })
                  )
                  done()
                })
            })
        })
      })
    })
  })
})
