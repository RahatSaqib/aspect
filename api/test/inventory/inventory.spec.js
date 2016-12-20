const supertest = require('supertest')
const chai = require('chai')
const shared = require('../utils/sharedToken')
const _ = require('lodash')

// This agent refers to PORT where program is runninng.
const server = supertest.agent('http://localhost:8080')
const assert = chai.assert

describe('Inventory Routes', () => {
  describe('Inventory List Route', () => {
    describe('/inventory', () => {
      const path = '/api/inventory'

      describe('GET', () => {
        shared.checkToken(server, path)

        it('should return a list of inventory items when using valid token', (done) => {
          server
            .get(path)
            .set('Authorization', `Bearer ${shared.token}`)
            .end((err, res) => {
              assert.equal(res.status, 200)
              assert.typeOf(res.body, 'Object')
              assert.property(res.body, 'data')
              assert.typeOf(res.body.data, 'array')
              assert.isAtLeast(res.body.data.length, 5)
              res.body.data.forEach((inventoryItem) => {
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

        it('should accept consumableId and siteName as query string parameters', (done) => {
          const consumableId = 2
          const siteNameFilter = 'clinic'
          server
            .get(`${path}?consumableId=${consumableId}&siteName=${siteNameFilter}`)
            .set('Authorization', `Bearer ${shared.token}`)
            .end((err, res) => {
              assert.equal(res.status, 200)
              res.body.data.forEach((inventoryItem) => {
                assert.equal(inventoryItem.consumableId, consumableId)
                assert.includes(inventoryItem.siteName.toLowerCase(), siteNameFilter.toLowerCase())
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

        it('should return a list of sites, each with a list of inventory items, when using valid token', (done) => {
          server
            .get(path)
            .set('Authorization', `Bearer ${shared.token}`)
            .end((err, res) => {
              assert.equal(res.status, 200)
              assert.typeOf(res.body, 'Object')
              assert.property(res.body, 'data')
              assert.typeOf(res.body.data, 'array')
              assert.isAtLeast(res.body.data.length, 1)
              res.body.data.forEach((site) => {
                assert.property(site, 'siteId')
                assert.property(site, 'siteName')
                assert.property(site, 'countryId')
                assert.property(site, 'stateId')
                assert.property(site, 'lgaId')
                assert.property(site, 'countryName')
                assert.property(site, 'stateName')
                assert.property(site, 'lgaName')
                assert.property(site, 'inventoryItems')
                site.inventoryItems.forEach((inventoryItem) => {
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

        it('should accept consumableId and siteName as query string parameters', (done) => {
          const consumableId = 1
          const siteNameFilter = 'lab'
          server
            .get(`${path}?consumableId=${consumableId}&siteName=${siteNameFilter}`)
            .set('Authorization', `Bearer ${shared.token}`)
            .end((err, res) => {
              assert.equal(res.status, 200)
              res.body.data.forEach((site) => {
                assert.includes(site.siteName.toLowerCase(), siteNameFilter.toLowerCase())
                site.inventoryItems.forEach((inventoryItem) => {
                  assert.equal(inventoryItem.consumableId, consumableId)
                })
              })
              done()
            })
        })
      })
    })

    describe('Inventory Adjustments', () => {
      const consumableName = 'GeneXpert TB Cartridge'
      const quantityToAdjust = 11

      describe('/inventory/add/{inventoryItemId}', () => {
        const path = '/api/inventory/add'

        describe('PUT', () => {
          it('should update the quantity of an inventory item', (done) => {
            server
              .get('/api/inventory/group-by-site')
              .set('Authorization', `Bearer ${shared.token}`)
              .end((err, res) => {
                const destinationSite = _.find(res.body.data,
                  site => _.some(site.inventoryItems, { consumableName }))
                const destinationInventoryItem =
                  _.find(destinationSite.inventoryItems, { consumableName })
                server
                  .put(`${path}/${destinationInventoryItem.id}`)
                  .send({
                    lotNumber: destinationInventoryItem.lotNumber,
                    expiresOn: destinationInventoryItem.expiresOn,
                    quantity: quantityToAdjust,
                    notes: '',
                    toSiteId: destinationSite.siteId,
                    dateAdjusted: (new Date()).toISOString()
                  })
                  .set('Authorization', `Bearer ${shared.token}`)
                  .end((err, res) => {
                    console.log(res)
                    assert.equal(res.status, 200)
                    assert.typeOf(res.body, 'Object')
                    assert.property(res.body, 'data')
                    assert.typeOf(res.body.data, 'Object')
                    assert.equal(res.body.data.quantityOnHand,
                      destinationInventoryItem.quantityOnHand + quantityToAdjust)
                    done()
                  })
              })
          })
        })
      })

      describe('/inventory/remove/{inventoryItemId}', () => {
        const path = '/api/inventory/remove'

        describe('PUT', () => {
          it('should update the quantity of an inventory item', (done) => {
            server
              .get('/api/inventory/group-by-site')
              .set('Authorization', `Bearer ${shared.token}`)
              .end((err, res) => {
                const sourceSite = _.find(res.body.data,
                  site => _.some(site.inventoryItems, { consumableName }))
                const sourceInventoryItem =
                  _.find(sourceSite.inventoryItems, { consumableName })
                server
                  .put(`${path}/${sourceInventoryItem.id}`)
                  .send({
                    lotNumber: sourceInventoryItem.lotNumber,
                    expiresOn: sourceInventoryItem.expiresOn,
                    quantity: quantityToAdjust,
                    notes: '',
                    fromSiteId: sourceSite.siteId,
                    reasonId: 1,
                    dateAdjusted: (new Date()).toISOString()
                  })
                  .set('Authorization', `Bearer ${shared.token}`)
                  .end((err, res) => {
                    assert.equal(res.status, 200)
                    assert.typeOf(res.body, 'Object')
                    assert.property(res.body, 'data')
                    assert.typeOf(res.body.data, 'Object')
                    assert.equal(res.body.data.quantityOnHand,
                      sourceInventoryItem.quantityOnHand - quantityToAdjust)
                    done()
                  })
              })
          })
        })
      })
    })
  })
})

