let supertest = require('supertest')
let chai = require('chai')
let shared = require('../utils/sharedToken')

// This agent refers to PORT where program is runninng.
let server = supertest.agent('http://localhost:8080')
let assert = chai.assert

describe('Inventory Routes',function() {
  describe('Inventory List Route', function() {
    describe('/inventory', function () {
      let path = '/api/inventory'

      describe('GET', function () {
        shared.checkToken(server, path)

        it('should return a list of inventory items when using valid token', function (done) {
          server
            .get(path)
            .set('Authorization', `Bearer ${shared.token}`)
            .end(function (err, res) {
              assert.equal(res.status, 200)
              assert.typeOf(res.body, 'Object')
              assert.property(res.body, 'data')
              assert.typeOf(res.body.data, 'array')
              assert.isAtLeast(res.body.data.length, 5)
              res.body.data.forEach(function (inventoryItem) {
                assert.property(inventoryItem, 'id')
                assert.property(inventoryItem, 'consumableId')
                assert.property(inventoryItem, 'siteId')
                assert.property(inventoryItem, 'expiresOn')
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

        it('should accept consumableId and siteName as query string parameters', function (done) {
          const consumableId = 2
          const siteNameFilter = 'clinic'
          server
            .get(`${path}?consumableId=${consumableId}&siteName=${siteNameFilter}`)
            .set('Authorization', `Bearer ${shared.token}`)
            .end(function (err, res) {
              assert.equal(res.status, 200)
              res.body.data.forEach(function (inventoryItem) {
                assert.equal(inventoryItem.consumableId, consumableId)
                assert.includes(inventoryItem.siteName.toLowerCase(), siteNameFilter.toLowerCase())
              })
              done()
            })
        })
      })
    })

    describe('/inventory/group-by-site', function () {
      let path = '/api/inventory/group-by-site'

      describe('GET', function () {
        shared.checkToken(server, path)

        it('should return a list of sites, each with a list of inventory items, when using valid token', function (done) {
          server
            .get(path)
            .set('Authorization', `Bearer ${shared.token}`)
            .end(function (err, res) {
              assert.equal(res.status, 200)
              assert.typeOf(res.body, 'Object')
              assert.property(res.body, 'data')
              assert.typeOf(res.body.data, 'array')
              assert.isAtLeast(res.body.data.length, 1)
              res.body.data.forEach(function (site) {
                assert.property(site, 'id')
                assert.property(site, 'name')
                assert.property(site, 'countryId')
                assert.property(site, 'stateId')
                assert.property(site, 'lgaId')
                assert.property(site, 'countryName')
                assert.property(site, 'stateName')
                assert.property(site, 'lgaName')
                assert.property(site, 'inventoryItems')
                site.inventoryItems.forEach(function (inventoryItem) {
                  assert.property(inventoryItem, 'id')
                  assert.property(inventoryItem, 'consumableId')
                  assert.property(inventoryItem, 'expiresOn')
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

        it('should accept consumableId and siteName as query string parameters', function (done) {
          const consumableId = 1
          const siteNameFilter = 'lab'
          server
            .get(`${path}?consumableId=${consumableId}&siteName=${siteNameFilter}`)
            .set('Authorization', `Bearer ${shared.token}`)
            .end(function (err, res) {
              assert.equal(res.status, 200)
              res.body.data.forEach(function (site) {
                assert.includes(site.name.toLowerCase(), siteNameFilter.toLowerCase())
                site.inventoryItems.forEach(function (inventoryItem) {
                  assert.equal(inventoryItem.consumableId, consumableId)
                })
              })
              done()
            })
        })
      })
    })
  })
})
