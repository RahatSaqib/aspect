const supertest = require('supertest')
const chai = require('chai')
const shared = require('../utils/sharedToken')
const _ = require('lodash')

const server = supertest.agent('http://localhost:8080')
const { assert } = chai

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
              assert.isAtLeast(res.body.data.length, 5)
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
              assert.isAtLeast(res.body.data.length, 1)
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
  })

  describe('Inventory Adjustments', () => {
    const consumableName = 'GeneXpert TB Cartridge'
    const quantityToAdjust = 11
    const getAllInventoryPath = '/api/inventory/group-by-site'
    const addInventoryPath = '/api/inventory/add'
    const removeInventoryPath = '/api/inventory/remove'
    const transferInventoryPath = '/api/inventory/transfer'
    const receiveInventoryPath = '/api/inventory/receive'
    let allInventoryItems = []

    beforeEach(done => {
      server
        .get(getAllInventoryPath)
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          allInventoryItems = res.body.data
          done()
        })
    })

    afterEach(done => {
      server
        .get(getAllInventoryPath)
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          const removeInventoryItemIds = inventoryItemsGroupedBySite =>
            _.map(inventoryItemsGroupedBySite, site =>
              Object.assign({}, site, {
                inventoryItems: _.map(site.inventoryItems, inventoryItem =>
                  _.omit(inventoryItem, 'id')
                ),
              })
            )
          const allInventoryItemsAfter = removeInventoryItemIds(res.body.data)
          assert.deepEqual(
            allInventoryItemsAfter,
            removeInventoryItemIds(allInventoryItems),
            'Inventory has changed after test. Did you clean up after yourself?'
          )
          done()
        })
    })

    describe('/inventory/add/{inventoryItemId}', () => {
      describe('PUT', () => {
        it('should update the quantity of an inventory item', done => {
          const destinationSite = _.find(allInventoryItems, site =>
            _.some(
              site.inventoryItems,
              inventoryItem =>
                inventoryItem.consumableName === consumableName &&
                inventoryItem.quantityOnHand !== -quantityToAdjust
            )
          )
          const destinationInventoryItem = _.find(
            destinationSite.inventoryItems,
            { consumableName }
          )
          server
            .put(`${addInventoryPath}/${destinationInventoryItem.id}`)
            .send({
              consumableId: destinationInventoryItem.consumableId,
              lotNumber: destinationInventoryItem.lotNumber,
              expiresOn: destinationInventoryItem.expiresOn,
              quantity: quantityToAdjust,
              notes: 'Testing add',
              toSiteId: destinationSite.siteId,
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
                _.max([
                  0,
                  destinationInventoryItem.quantityOnHand + quantityToAdjust,
                ])
              )
              // Clean up
              server
                .put(`${removeInventoryPath}/${destinationInventoryItem.id}`)
                .send({
                  consumableId: destinationInventoryItem.consumableId,
                  lotNumber: destinationInventoryItem.lotNumber,
                  expiresOn: destinationInventoryItem.expiresOn,
                  quantity: quantityToAdjust,
                  notes: 'Cleaning up after testing add',
                  fromSiteId: destinationSite.siteId,
                  reasonId: 1,
                  dateAdjusted: new Date().toISOString(),
                })
                .set('Authorization', `Bearer ${shared.token}`)
                .end(done)
            })
        })
      })
    })

    describe('/inventory/remove/{inventoryItemId}', () => {
      describe('PUT', () => {
        it('should update the quantity of an inventory item', done => {
          const sourceSite = _.find(allInventoryItems, site =>
            _.some(
              site.inventoryItems,
              inventoryItem =>
                inventoryItem.consumableName === consumableName &&
                inventoryItem.quantityOnHand !== quantityToAdjust
            )
          )
          const sourceInventoryItem = _.find(sourceSite.inventoryItems, {
            consumableName,
          })
          server
            .put(`${removeInventoryPath}/${sourceInventoryItem.id}`)
            .send({
              consumableId: sourceInventoryItem.consumableId,
              lotNumber: sourceInventoryItem.lotNumber,
              expiresOn: sourceInventoryItem.expiresOn,
              quantity: quantityToAdjust,
              notes: 'Testing remove',
              fromSiteId: sourceSite.siteId,
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
                _.max([
                  0,
                  sourceInventoryItem.quantityOnHand - quantityToAdjust,
                ])
              )
              // Clean up
              server
                .put(`${addInventoryPath}/${sourceInventoryItem.id}`)
                .send({
                  consumableId: sourceInventoryItem.consumableId,
                  lotNumber: sourceInventoryItem.lotNumber,
                  expiresOn: sourceInventoryItem.expiresOn,
                  quantity: quantityToAdjust,
                  notes: 'Cleaning up after testing remove',
                  toSiteId: sourceSite.siteId,
                  dateAdjusted: new Date().toISOString(),
                })
                .set('Authorization', `Bearer ${shared.token}`)
                .end(done)
            })
        })

        it('should remove the inventory item from view quantity is zero', done => {
          const sourceSite = _.find(allInventoryItems, site =>
            _.some(site.inventoryItems, { consumableName })
          )
          const sourceInventoryItem = _.find(sourceSite.inventoryItems, {
            consumableName,
          })
          server
            .put(`${removeInventoryPath}/${sourceInventoryItem.id}`)
            .send({
              consumableId: sourceInventoryItem.consumableId,
              lotNumber: sourceInventoryItem.lotNumber,
              expiresOn: sourceInventoryItem.expiresOn,
              quantity: sourceInventoryItem.quantityOnHand,
              notes: 'Testing removal of all inventory on hand',
              fromSiteId: sourceSite.siteId,
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
                        id: sourceInventoryItem.id,
                      })
                    )
                  )
                  // Clean up
                  server
                    .put(`${addInventoryPath}/999`) // TODO: Add another item so that we can add using a different ID
                    .send({
                      consumableId: sourceInventoryItem.consumableId,
                      lotNumber: sourceInventoryItem.lotNumber,
                      expiresOn: sourceInventoryItem.expiresOn,
                      quantity: sourceInventoryItem.quantityOnHand,
                      notes:
                        'Cleaning up after testing removal of all inventory on hand',
                      toSiteId: sourceSite.siteId,
                      dateAdjusted: new Date().toISOString(),
                    })
                    .set('Authorization', `Bearer ${shared.token}`)
                    .end(done)
                })
            })
        })
      })
    })

    describe('/inventory/transfer/{inventoryItemId}', () => {
      describe('PUT', () => {
        it('should add an inventory item in transit to the destination site', done => {
          const sourceSite = _.find(allInventoryItems, site =>
            _.some(site.inventoryItems, { consumableName })
          )
          const sourceInventoryItem = _.find(sourceSite.inventoryItems, {
            consumableName,
          })
          const destinationSite = _.find(
            allInventoryItems,
            site => site.siteId !== sourceSite.siteId
          )
          const existingTransitItem = _.find(destinationSite.inventoryItems, {
            inTransitFromSiteId: sourceSite.siteId,
            expiresOn: sourceInventoryItem.expiresOn,
            consumableId: sourceInventoryItem.consumableId,
          })
          server
            .put(`${transferInventoryPath}/${sourceInventoryItem.id}`)
            .send({
              consumableId: sourceInventoryItem.consumableId,
              lotNumber: sourceInventoryItem.lotNumber,
              expiresOn: sourceInventoryItem.expiresOn,
              quantity: quantityToAdjust,
              notes: 'Testing transfer',
              fromSiteId: sourceSite.siteId,
              toSiteId: destinationSite.siteId,
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
                  sourceInventoryItem.quantityOnHand - quantityToAdjust,
                ])
              )
              const transitItem = res.body.data.newInventoryItem
              assert.deepEqual(
                transitItem,
                Object.assign({}, transitItem, {
                  quantityOnHand: _.max([
                    0,
                    existingTransitItem
                      ? existingTransitItem.quantityOnHand + quantityToAdjust
                      : quantityToAdjust,
                  ]),
                  inTransitFromSiteId: sourceSite.siteId,
                  siteId: destinationSite.siteId,
                  lotNumber: sourceInventoryItem.lotNumber,
                  expiresOn: sourceInventoryItem.expiresOn,
                })
              )
              // Clean up
              server
                .put(`${receiveInventoryPath}/${transitItem.id}`)
                .send({
                  consumableId: transitItem.consumableId,
                  lotNumber: transitItem.lotNumber,
                  expiresOn: transitItem.expiresOn,
                  quantity: transitItem.quantityOnHand,
                  notes: 'Cleaning up after testing transfer 1',
                  fromSiteId: transitItem.siteId,
                  toSiteId: destinationSite.siteId,
                  dateAdjusted: new Date().toISOString(),
                })
                .set('Authorization', `Bearer ${shared.token}`)
                .end((err, res) => {
                  const receivedItem = res.body.data
                  server
                    .put(`${addInventoryPath}/${sourceInventoryItem.id}`)
                    .send({
                      consumableId: sourceInventoryItem.consumableId,
                      lotNumber: sourceInventoryItem.lotNumber,
                      expiresOn: sourceInventoryItem.expiresOn,
                      quantity: quantityToAdjust,
                      notes: 'Cleaning up after testing transfer 2',
                      toSiteId: sourceSite.siteId,
                      dateAdjusted: new Date().toISOString(),
                    })
                    .set('Authorization', `Bearer ${shared.token}`)
                    .end(() => {
                      server
                        .put(`${removeInventoryPath}/${receivedItem.id}`)
                        .send({
                          consumableId: receivedItem.consumableId,
                          lotNumber: receivedItem.lotNumber,
                          expiresOn: receivedItem.expiresOn,
                          quantity: quantityToAdjust,
                          notes: 'Cleaning up after testing add 3',
                          fromSiteId: destinationSite.siteId,
                          reasonId: 1,
                          dateAdjusted: new Date().toISOString(),
                        })
                        .set('Authorization', `Bearer ${shared.token}`)
                        .end(done)
                    })
                })
            })
        })
      })
    })

    describe('/inventory/receive/{inventoryItemId}', () => {
      describe('PUT', () => {
        it('should add an inventory item to the site', done => {
          const sourceSite = _.find(allInventoryItems, site =>
            _.some(site.inventoryItems, { consumableName })
          )
          const sourceInventoryItem = _.find(sourceSite.inventoryItems, {
            consumableName,
          })
          const destinationSite = _.find(
            allInventoryItems,
            site => site.siteId !== sourceSite.siteId
          )
          const existingDestinationItem = _.find(
            destinationSite.inventoryItems,
            {
              expiresOn: sourceInventoryItem.expiresOn,
              consumableId: sourceInventoryItem.consumableId,
            }
          )
          server
            .put(`${transferInventoryPath}/${sourceInventoryItem.id}`)
            .send({
              consumableId: sourceInventoryItem.consumableId,
              lotNumber: sourceInventoryItem.lotNumber,
              expiresOn: sourceInventoryItem.expiresOn,
              quantity: quantityToAdjust,
              notes: 'Creating a transfer to test receiving an item',
              fromSiteId: sourceSite.siteId,
              toSiteId: destinationSite.siteId,
              dateAdjusted: new Date().toISOString(),
            })
            .set('Authorization', `Bearer ${shared.token}`)
            .end((err, res) => {
              const transitItem = res.body.data.newInventoryItem
              server
                .put(`${receiveInventoryPath}/${transitItem.id}`)
                .send({
                  consumableId: transitItem.consumableId,
                  lotNumber: transitItem.lotNumber,
                  expiresOn: transitItem.expiresOn,
                  quantity: transitItem.quantityOnHand,
                  notes: 'Testing receiving a lot in transit',
                  fromSiteId: sourceSite.siteId,
                  toSiteId: destinationSite.siteId,
                  dateAdjusted: new Date().toISOString(),
                })
                .set('Authorization', `Bearer ${shared.token}`)
                .end((err, res) => {
                  assert.equal(res.status, 200)
                  assert.typeOf(res.body, 'Object')
                  const receivedItem = res.body.data
                  assert.deepEqual(
                    receivedItem,
                    Object.assign({}, res.body.data, {
                      quantityOnHand: _.max([
                        0,
                        existingDestinationItem
                          ? existingDestinationItem.quantityOnHand +
                            quantityToAdjust
                          : quantityToAdjust,
                      ]),
                      siteId: destinationSite.siteId,
                      lotNumber: sourceInventoryItem.lotNumber,
                      expiresOn: sourceInventoryItem.expiresOn,
                    })
                  )
                  // Clean up
                  server
                    .put(`${addInventoryPath}/${sourceInventoryItem.id}`)
                    .send({
                      consumableId: sourceInventoryItem.consumableId,
                      lotNumber: sourceInventoryItem.lotNumber,
                      expiresOn: sourceInventoryItem.expiresOn,
                      quantity: quantityToAdjust,
                      notes:
                        'Cleaning up after testing receiving a lot in transit 1',
                      toSiteId: sourceSite.siteId,
                      dateAdjusted: new Date().toISOString(),
                    })
                    .set('Authorization', `Bearer ${shared.token}`)
                    .end(() => {
                      server
                        .put(`${removeInventoryPath}/${receivedItem.id}`)
                        .send({
                          consumableId: receivedItem.consumableId,
                          lotNumber: receivedItem.lotNumber,
                          expiresOn: receivedItem.expiresOn,
                          quantity: quantityToAdjust,
                          notes:
                            'Cleaning up after testing receiving a lot in transit 2',
                          fromSiteId: destinationSite.siteId,
                          reasonId: 1,
                          dateAdjusted: new Date().toISOString(),
                        })
                        .set('Authorization', `Bearer ${shared.token}`)
                        .end(done)
                    })
                })
            })
        })
      })
    })
  })
})
