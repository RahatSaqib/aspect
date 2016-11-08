const _ = require('lodash')
const supertest = require('supertest')
const chai = require('chai')
const shared = require('../utils/sharedToken')
const server = supertest.agent('http://localhost:8080')
const assert = chai.assert

describe('Consumable Assay Routes', function(){
  describe('/consumable-assays', function(){
    const path = '/api/consumable-assays/'

    describe('GET', function(){
      it('should return a list of assay consumables when using valid token and an assay id', function(done){
        server
          .get('/api/inventory/consumable-types')
          .set('Authorization', 'Bearer ' + shared.token)
          .end(function(err,res){
            const gxMtbCartridge = _.find(res.body.data, {name: 'GeneXpert TB Cartridge'})
            server
              .get(`${path}${gxMtbCartridge.id}`)
              .set('Authorization', 'Bearer ' + shared.token)
              .end(function(err,res){
                assert.equal(res.status, 200)
                assert.typeOf(res.body, 'Object')
                assert.isTrue(res.body.ok)
                assert.property(res.body, 'data')
                assert.typeOf(res.body.data, 'array')
                assert.isAtLeast(res.body.data.length, 1)
                assert.property(res.body.data[0], 'consumableId')
                assert.property(res.body.data[0], 'assayId')
                assert.property(res.body.data[0], 'quantity')
                res.body.data.forEach(function(assayConsumable) {
                  assert.equal(assayConsumable.consumableId, gxMtbCartridge.id)
                })
                done()
              })
          })
      })
    })
  })
})

