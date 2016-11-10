const supertest = require('supertest')
const chai = require('chai')
const shared = require('../utils/sharedToken')

// This agent refers to PORT where program is runninng.
const server = supertest.agent('http://localhost:8080')
const assert = chai.assert

describe('Consumable Routes', () => {
  describe('Consumable Type Route', () => {
    const path = '/api/inventory/consumable-types'

    describe('GET', () => {
      shared.checkToken(server, path)

      it('should return a list of consumable types when using valid token', (done) => {
        server
        .get(path)
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.isAtLeast(res.body.data.length, 2)
          assert.property(res.body.data[0], 'id')
          assert.property(res.body.data[0], 'name')
          assert.property(res.body.data[0], 'unit')
          assert.property(res.body.data[0], 'canExpire')
          assert.property(res.body.data[0], 'manufacturer')
          assert.property(res.body.data[0], 'autoInclude')
          assert.property(res.body, 'total')
          done()
        })
      })
    })
  })

  describe('Consumable Reason Route', () => {
    const path = '/api/inventory/consumable-reason'

    describe('GET', () => {
      shared.checkToken(server, path)

      it('should return a list of consumable reasons when using valid token', (done) => {
        server
        .get(path)
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.isAtLeast(res.body.data.length, 2)
          assert.property(res.body.data[0], 'id')
          assert.property(res.body.data[0], 'name')
          assert.property(res.body.data[0], 'decrease')
          assert.property(res.body, 'total')
          done()
        })
      })
    })
  })

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

    xdescribe('/inventory/group-by-site', function () {
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

    xdescribe('/inventory/group-by-consumable', function(){
      let path = '/api/inventory/group-by-consumable'

      describe('GET',function(){
        shared.checkToken(server, path)

        it('should return a list of consumables, each with a list of sites (with inventory items), when using valid token', function(done){
          server
            .get(path)
            .set('Authorization', `Bearer ${shared.token}`)
            .end(function(err,res){
              assert.equal(res.status, 200)
              assert.typeOf(res.body, 'Object')
              assert.property(res.body, 'data')
              assert.typeOf(res.body.data, 'array')
              assert.isAtLeast(res.body.data.length, 1)
              res.body.data.forEach(function(consumable) {
                assert.property(consumable, 'id')
                assert.property(consumable, 'name')
                assert.property(consumable, 'manufacturer')
                assert.property(consumable, 'unitShortName')
                assert.property(consumable, 'sites')
                consumable.sites.forEach(function(site) {
                  assert.property(site, 'id')
                  assert.property(site, 'name')
                  assert.property(site, 'countryId')
                  assert.property(site, 'stateId')
                  assert.property(site, 'lgaId')
                  assert.property(site, 'countryName')
                  assert.property(site, 'stateName')
                  assert.property(site, 'lgaName')
                  assert.property(site, 'inventoryItems')
                  site.inventoryItems.forEach(function(inventoryItem) {
                    assert.property(inventoryItem, 'id')
                    assert.property(inventoryItem, 'expiresOn')
                    assert.property(inventoryItem, 'quantityOnHand')
                  })
                })
                assert.property(res.body, 'total')
                done()
              })
            })
        })

        it('should accept consumableId and siteName as query string parameters', function(done){
          const consumableId = 1
          const siteNameFilter = 'lab'
          server
            .get(`${path}?consumableId=${consumableId}&siteName=${siteNameFilter}`)
            .set('Authorization', `Bearer ${shared.token}`)
            .end(function(err,res) {
              assert.equal(res.status, 200)
              res.body.data.forEach(function(consumable) {
                assert.equal(consumable.id, consumableId)
                consumable.sites.forEach(function(site) {
                  assert.includes(site.site.toLowerCase(), siteNameFilter.toLowerCase())
                })
              })
              done()
            })
        })
      })
    })

    xdescribe('/inventory/group-by-site-and-consumable', function(){
      let path = '/api/inventory/group-by-site-and-consumable'

      describe('GET',function(){
        shared.checkToken(server, path)

        it('should return a list of sites, each with a list of consumables (with inventory items), when using valid token', function (done) {
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
                assert.property(site, 'consumables')
                site.consumables.forEach(function (consumable) {
                  assert.property(consumable, 'id')
                  assert.property(consumable, 'consumableName')
                  assert.property(consumable, 'manufacturer')
                  assert.property(consumable, 'unitShortName')
                  assert.property(consumable, 'inventoryItems')
                  consumable.inventoryItems.forEach(function (inventoryItem) {
                    assert.property(inventoryItem, 'id')
                    assert.property(inventoryItem, 'expiresOn')
                    assert.property(inventoryItem, 'quantityOnHand')
                  })
                })
              })
              assert.property(res.body, 'total')
              done()
            })
        })

        it('should accept consumableId and siteName as query string parameters', function (done) {
          const consumableId = 2
          const siteNameFilter = 'lancaster'
          server
            .get(`${path}?consumableId=${consumableId}&siteName=${siteNameFilter}`)
            .set('Authorization', `Bearer ${shared.token}`)
            .end(function (err, res) {
              assert.equal(res.status, 200)
              res.body.data.forEach(function (site) {
                assert.includes(site.name.toLowerCase(), siteNameFilter.toLowerCase())
                site.consumables.forEach(function (consumable) {
                  assert.equal(consumable.id, consumableId)
                })
              })
              done()
            })
        })
      })
    })
  })
})
