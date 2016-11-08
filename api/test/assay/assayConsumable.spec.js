const _ = require('lodash')
const supertest = require('supertest')
const chai = require('chai')
const shared = require('../utils/sharedToken')
const server = supertest.agent('http://localhost:8080')
const assert = chai.assert

describe('Assay Consumable Routes',function(){
  describe('/assay-consumables/', function(){

    const path = '/api/assay-consumables/'

    describe('GET',function(){
      it('should return a list of assay consumables when using valid token and an assay id', function(done){
        server
          .get('/api/assay')
          .set('Authorization', 'Bearer ' + shared.token)
          .end(function(err,res){
            const gxMtbRifAssay = _.find(res.body.data, {name: 'GeneXpert MTB/Rif'})
            const gxEbolaAssay = _.find(res.body.data, {name: 'GeneXpert Ebola'})
            server
              .get(`${path}${gxMtbRifAssay.id}`)
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
                  assert.equal(assayConsumable.assayId, gxMtbRifAssay.id)
                })

                server
                  .get(`${path}${gxEbolaAssay.id}`)
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
                      assert.equal(assayConsumable.assayId, gxEbolaAssay.id)
                    })
                    done()
                  })
              })
          })
      })
    })
  })

  describe('/assay-consumable', function(){

    const path = '/api/assay-consumable'
    let gxHivVlAssayId, gxHivVlCartridgeId, initialQuantity = 0.32, updatedQuantity = 5.68

    describe('POST',function(){
      it('should return a newly created assay consumable when using valid token, consumable id and an assay id', function(done){
        server
          .get('/api/assay')
          .set('Authorization', 'Bearer ' + shared.token)
          .end(function(err,res){
            const gxHivVlAssay = _.find(res.body.data, {name: 'GeneXpert HIV VL'})
            gxHivVlAssayId = gxHivVlAssay.id

            server
              .get('/api/inventory/consumable-types')
              .set('Authorization', 'Bearer ' + shared.token)
              .end(function(err,res){
                const gxHivVlCartridge = _.find(res.body.data, {name: 'GeneXpert HIV Viral Load Cartridge'})
                gxHivVlCartridgeId = gxHivVlCartridge.id

                server
                  .post(path)
                  .send({assayId: gxHivVlAssayId, consumableId: gxHivVlCartridgeId, quantity: initialQuantity})
                  .set('Authorization', 'Bearer ' + shared.token)
                  .end(function(err,res){
                    assert.equal(res.status, 200)
                    assert.typeOf(res.body, 'Object')
                    assert.isTrue(res.body.ok)
                    assert.property(res.body, 'data')
                    assert.typeOf(res.body.data, 'Object')
                    assert.equal(res.body.data.consumableId, gxHivVlCartridgeId)
                    assert.equal(res.body.data.assayId, gxHivVlAssayId)
                    assert.equal(res.body.data.quantity, initialQuantity)

                    server
                      .post(path)
                      .send({assayId: gxHivVlAssayId, consumableId: gxHivVlCartridgeId, quantity: updatedQuantity})
                      .set('Authorization', 'Bearer ' + shared.token)
                      .end(function(err,res){
                        assert.equal(res.status, 500, 'We should not be able to post a duplicate assay consumable')

                        server
                          .get(`/api/assay-consumables/${gxHivVlAssayId}`)
                          .set('Authorization', 'Bearer ' + shared.token)
                          .end(function(err,res){
                            const newAssayConsumable = _.find(res.body.data, {assayId: gxHivVlAssayId, consumableId: gxHivVlCartridgeId})
                            assert.equal(newAssayConsumable.quantity, initialQuantity)
                            done()
                          })
                      })
                  })
              })
          })
      })
    })

    describe('PUT',function(){
      it('should return the updated assay consumable when using valid token, consumable id and an assay id', function(done){
        server
          .put(`${path}/${gxHivVlAssayId}/${gxHivVlCartridgeId}`)
          .send({quantity: updatedQuantity})
          .set('Authorization', 'Bearer ' + shared.token)
          .end(function(err,res){
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
            assert.isTrue(res.body.ok)
            assert.property(res.body, 'data')
            assert.typeOf(res.body.data, 'Object')
            assert.equal(res.body.data.consumableId, gxHivVlCartridgeId)
            assert.equal(res.body.data.assayId, gxHivVlAssayId)
            assert.equal(res.body.data.quantity, updatedQuantity)

            server
              .get(`/api/assay-consumables/${gxHivVlAssayId}`)
              .set('Authorization', 'Bearer ' + shared.token)
              .end(function(err,res){
                const newAssayConsumable = _.find(res.body.data, {assayId: gxHivVlAssayId, consumableId: gxHivVlCartridgeId})
                assert.equal(newAssayConsumable.quantity, updatedQuantity)
                done()
              })
          })
      })
    })

    describe('DELETE',function(){
      it('should remove the assay consumable from the system', function(done){
        server
          .delete(`${path}/${gxHivVlAssayId}/${gxHivVlCartridgeId}`)
          .set('Authorization', 'Bearer ' + shared.token)
          .end(function(err,res){
            assert.equal(res.status, 200)
            assert.isTrue(res.body.ok)

            server
              .get(`/api/assay-consumables/${gxHivVlAssayId}`)
              .set('Authorization', 'Bearer ' + shared.token)
              .end(function(err,res){
                const deletedAssayConsumable = _.find(res.body.data, {assayId: gxHivVlAssayId, consumableId: gxHivVlCartridgeId})
                assert.isTrue(_.isEmpty(deletedAssayConsumable))
                done()
              })
          })
      })
    })
  })
})

