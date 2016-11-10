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

  describe('Inventory List Route', function(){
    let path = '/api/inventory'

    describe('GET',function(){
      shared.checkToken(server, path)

      it('should return a list of inventory items when using valid token', function(done){
        server
          .get(path)
          .set('Authorization', 'Bearer '+shared.token)
          .end(function(err,res){
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
            assert.property(res.body, 'data')
            assert.typeOf(res.body.data, 'array')
            assert.isAtLeast(res.body.data.length, 5)
            assert.property(res.body.data[0], 'id')
            assert.property(res.body.data[0], 'consumableId')
            assert.property(res.body.data[0], 'siteId')
            assert.property(res.body.data[0], 'expiresOn')
            assert.property(res.body.data[0], 'quantityOnHand')
            assert.property(res.body.data[0], 'consumableName')
            assert.property(res.body.data[0], 'manufacturer')
            assert.property(res.body.data[0], 'unitShortName')
            assert.property(res.body.data[0], 'siteName')
            assert.property(res.body.data[0], 'countryId')
            assert.property(res.body.data[0], 'stateId')
            assert.property(res.body.data[0], 'lgaId')
            assert.property(res.body.data[0], 'countryName')
            assert.property(res.body.data[0], 'stateName')
            assert.property(res.body.data[0], 'lgaName')
            assert.property(res.body, 'total')
            done()
          })
      })
    })
  })
})

