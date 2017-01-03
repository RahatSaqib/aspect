const _ = require('lodash')
const supertest = require('supertest')
const chai = require('chai')
const shared = require('../utils/sharedToken')

const server = supertest.agent('http://localhost:8080')
const assert = chai.assert

describe('Assay Consumable Routes', () => {
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
            assert.property(res.body.data[0], 'unitShortName')
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
            assert.property(res.body.data[0], 'i18nKey')
            assert.property(res.body.data[0], 'decrease')
            assert.property(res.body, 'total')
            done()
          })
      })
    })
  })

  describe('Consumable Assay Routes', () => {
    describe('/consumable-assays', () => {
      const path = '/api/consumable-assays/'

      describe('GET', () => {
        it('should return a list of assay consumables when using valid token and an assay id', (done) => {
          server
            .get('/api/inventory/consumable-types')
            .set('Authorization', `Bearer ${shared.token}`)
            .end((err, res) => {
              const gxMtbCartridge = _.find(res.body.data, { name: 'GeneXpert TB Cartridge' })
              server
                .get(`${path}${gxMtbCartridge.id}`)
                .set('Authorization', `Bearer ${shared.token}`)
                .end((err, res) => {
                  assert.equal(res.status, 200)
                  assert.typeOf(res.body, 'Object')
                  assert.isTrue(res.body.ok)
                  assert.property(res.body, 'data')
                  assert.typeOf(res.body.data, 'array')
                  assert.isAtLeast(res.body.data.length, 1)
                  res.body.data.forEach((assayConsumable) => {
                    assert.equal(assayConsumable.consumableId, gxMtbCartridge.id)
                    assert.property(assayConsumable, 'assayId')
                    assert.property(assayConsumable, 'quantity')
                    assert.property(assayConsumable, 'consumableName')
                    assert.property(assayConsumable, 'unitName')
                    assert.property(assayConsumable, 'unitShortName')
                    assert.property(assayConsumable, 'assayName')
                    assert.property(assayConsumable, 'assayI18nKey')
                  })
                  done()
                })
            })
        })
      })
    })

    describe('/assay-consumables/', () => {
      const path = '/api/assay-consumables/'

      describe('GET', () => {
        it('should return a list of assay consumables when using valid token and an assay id', (done) => {
          server
            .get('/api/assay')
            .set('Authorization', `Bearer ${shared.token}`)
            .end((err, res) => {
              const gxMtbRifAssay = _.find(res.body.data, { name: 'GeneXpert MTB/Rif' })
              const gxEbolaAssay = _.find(res.body.data, { name: 'GeneXpert Ebola' })
              server
                .get(`${path}${gxMtbRifAssay.id}`)
                .set('Authorization', `Bearer ${shared.token}`)
                .end((err, res) => {
                  assert.equal(res.status, 200)
                  assert.typeOf(res.body, 'Object')
                  assert.isTrue(res.body.ok)
                  assert.property(res.body, 'data')
                  assert.typeOf(res.body.data, 'array')
                  assert.isAtLeast(res.body.data.length, 1)
                  res.body.data.forEach((assayConsumable) => {
                    assert.equal(assayConsumable.assayId, gxMtbRifAssay.id)
                    assert.property(assayConsumable, 'consumableId')
                    assert.property(assayConsumable, 'quantity')
                    assert.property(assayConsumable, 'consumableName')
                    assert.property(assayConsumable, 'unitName')
                    assert.property(assayConsumable, 'unitShortName')
                    assert.property(assayConsumable, 'assayName')
                    assert.property(assayConsumable, 'assayI18nKey')
                  })

                  server
                    .get(`${path}${gxEbolaAssay.id}`)
                    .set('Authorization', `Bearer ${shared.token}`)
                    .end((err, res) => {
                      assert.equal(res.status, 200)
                      assert.typeOf(res.body, 'Object')
                      assert.isTrue(res.body.ok)
                      assert.property(res.body, 'data')
                      assert.typeOf(res.body.data, 'array')
                      assert.isAtLeast(res.body.data.length, 1)
                      res.body.data.forEach((assayConsumable) => {
                        assert.equal(assayConsumable.assayId, gxEbolaAssay.id)
                        assert.property(assayConsumable, 'consumableId')
                        assert.property(assayConsumable, 'quantity')
                        assert.property(assayConsumable, 'consumableName')
                        assert.property(assayConsumable, 'unitName')
                        assert.property(assayConsumable, 'unitShortName')
                        assert.property(assayConsumable, 'assayName')
                        assert.property(assayConsumable, 'assayI18nKey')
                      })
                      done()
                    })
                })
            })
        })
      })
    })

    describe('/assay-consumable', () => {
      const path = '/api/assay-consumable'
      let gxHivVlAssayId
      let gxHivVlCartridgeId
      const initialQuantity = 0.32
      const updatedQuantity = 5.68

      describe('POST', () => {
        it('should return a newly created assay consumable when using valid token, consumable id and an assay id', (done) => {
          server
            .get('/api/assay')
            .set('Authorization', `Bearer ${shared.token}`)
            .end((err, res) => {
              const gxHivVlAssay = _.find(res.body.data, { name: 'GeneXpert HIV VL' })
              gxHivVlAssayId = gxHivVlAssay.id

              server
                .get('/api/inventory/consumable-types')
                .set('Authorization', `Bearer ${shared.token}`)
                .end((err, res) => {
                  const gxHivVlCartridge = _.find(res.body.data, { name: 'GeneXpert HIV Viral Load Cartridge' })
                  gxHivVlCartridgeId = gxHivVlCartridge.id

                  server
                    .post(path)
                    .send({
                      assayId: gxHivVlAssayId,
                      consumableId: gxHivVlCartridgeId,
                      quantity: initialQuantity
                    })
                    .set('Authorization', `Bearer ${shared.token}`)
                    .end((err, res) => {
                      assert.equal(res.status, 200)
                      assert.typeOf(res.body, 'Object')
                      assert.isTrue(res.body.ok)
                      assert.property(res.body, 'data')
                      assert.typeOf(res.body.data, 'Object')
                      assert.equal(res.body.data.consumableId, gxHivVlCartridgeId)
                      assert.equal(res.body.data.assayId, gxHivVlAssayId)
                      assert.equal(res.body.data.quantity, initialQuantity)
                      assert.property(res.body.data, 'consumableName')
                      assert.property(res.body.data, 'unitName')
                      assert.property(res.body.data, 'unitShortName')
                      assert.property(res.body.data, 'assayName')
                      assert.property(res.body.data, 'assayI18nKey')

                      server
                        .post(path)
                        .set('Authorization', `Bearer ${shared.token}`)
                        .send({
                          assayId: gxHivVlAssayId,
                          consumableId:
                          gxHivVlCartridgeId,
                          quantity: updatedQuantity
                        })
                        .set('Authorization', `Bearer ${shared.token}`)
                        .end((err, res) => {
                          assert.equal(res.status, 409, 'We should not be able to post a duplicate assay consumable')
                          assert.deepEqual(res.body, {
                            statusCode: 409,
                            error: 'Conflict',
                            message: 'There is already an record for this assay and consumable'
                          })

                          server
                            .get(`/api/assay-consumables/${gxHivVlAssayId}`)
                            .set('Authorization', `Bearer ${shared.token}`)
                            .end((err, res) => {
                              const newAssayConsumable = _.find(res.body.data, {
                                assayId: gxHivVlAssayId, consumableId: gxHivVlCartridgeId })
                              assert.equal(newAssayConsumable.quantity, initialQuantity)
                              done()
                            })
                        })
                    })
                })
            })
        })
      })

      describe('PUT', () => {
        it('should return the updated assay consumable when using valid token, consumable id and an assay id', (done) => {
          server
            .put(`${path}/${gxHivVlAssayId}/${gxHivVlCartridgeId}`)
            .send({ quantity: updatedQuantity })
            .set('Authorization', `Bearer ${shared.token}`)
            .end((err, res) => {
              assert.equal(res.status, 200)
              assert.typeOf(res.body, 'Object')
              assert.isTrue(res.body.ok)
              assert.property(res.body, 'data')
              assert.typeOf(res.body.data, 'Object')
              assert.equal(res.body.data.consumableId, gxHivVlCartridgeId)
              assert.equal(res.body.data.assayId, gxHivVlAssayId)
              assert.equal(res.body.data.quantity, updatedQuantity)
              assert.property(res.body.data, 'consumableName')
              assert.property(res.body.data, 'unitName')
              assert.property(res.body.data, 'unitShortName')
              assert.property(res.body.data, 'assayName')
              assert.property(res.body.data, 'assayI18nKey')

              server
                .get(`/api/assay-consumables/${gxHivVlAssayId}`)
                .set('Authorization', `Bearer ${shared.token}`)
                .end((err, res) => {
                  const newAssayConsumable = _.find(res.body.data, {
                    assayId: gxHivVlAssayId, consumableId: gxHivVlCartridgeId })
                  assert.equal(newAssayConsumable.quantity, updatedQuantity)
                  done()
                })
            })
        })
      })

      describe('DELETE', () => {
        it('should remove the assay consumable from the system', (done) => {
          server
            .delete(`${path}/${gxHivVlAssayId}/${gxHivVlCartridgeId}`)
            .set('Authorization', `Bearer ${shared.token}`)
            .end((err, res) => {
              assert.equal(res.status, 200)
              assert.isTrue(res.body.ok)

              server
                .get(`/api/assay-consumables/${gxHivVlAssayId}`)
                .set('Authorization', `Bearer ${shared.token}`)
                .end((err, res) => {
                  const deletedAssayConsumable = _.find(res.body.data, {
                    assayId: gxHivVlAssayId, consumableId: gxHivVlCartridgeId })
                  assert.isTrue(_.isEmpty(deletedAssayConsumable))
                  done()
                })
            })
        })
      })
    })
  })
})
