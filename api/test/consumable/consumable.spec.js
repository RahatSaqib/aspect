const _ = require('lodash')
const supertest = require('supertest')
const chai = require('chai')
const shared = require('../utils/sharedToken')
const { run } = require('../../src/db')

const server = supertest.agent('http://localhost:8080')
const { assert, expect } = chai

describe('Assay Consumable Routes', () => {
  describe('Consumable Type Route', () => {
    const path = '/api/inventory/consumable-types'

    describe('GET', () => {
      shared.checkToken(server, path)

      it('should return a list of consumable types when using valid token', done => {
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

      it('should return a list of consumable reasons when using valid token', done => {
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
            assert.property(res.body.data[0], 'reset')
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
        it('should return a list of assay consumables when using valid token and an assay id', done => {
          server
            .get('/api/inventory/consumable-types')
            .set('Authorization', `Bearer ${shared.token}`)
            .end((err, res) => {
              const gxMtbCartridge = _.find(res.body.data, {
                name: 'GeneXpert TB Cartridge',
              })
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
                  res.body.data.forEach(assayConsumable => {
                    assert.equal(
                      assayConsumable.consumableId,
                      gxMtbCartridge.id
                    )
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
        it('should return a list of assay consumables when using valid token and an assay id', done => {
          server
            .get('/api/assay')
            .set('Authorization', `Bearer ${shared.token}`)
            .end((err, res) => {
              const gxMtbRifAssay = _.find(res.body.data, {
                name: 'GeneXpert MTB/Rif',
              })
              const gxEbolaAssay = _.find(res.body.data, {
                name: 'GeneXpert Ebola',
              })
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
                  res.body.data.forEach(assayConsumable => {
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
                      res.body.data.forEach(assayConsumable => {
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
      let assayId
      let consumableId
      const initialQuantity = 0.32
      const updatedQuantity = 5.68

      before(async () =>
        run(async knex => {
          assayId = await getTestAssayId(knex)
          consumableId = await createTestConsumable(knex)
        })
      )

      after(async () =>
        run(async knex => {
          await cleanUpTestConsumable(knex, consumableId)
        })
      )

      describe('POST', () => {
        afterEach(async () =>
          run(async knex => {
            await knex('ConsumableAssay')
              .where({ consumableId, assayId })
              .delete()
          })
        )
        it('should return a newly created assay consumable when using valid token, consumable id and an assay id', done => {
          server
            .post(path)
            .send({
              assayId,
              consumableId,
              quantity: initialQuantity,
            })
            .set('Authorization', `Bearer ${shared.token}`)
            .end((err, res) => {
              assert.equal(res.status, 200)
              assert.typeOf(res.body, 'Object')
              assert.isTrue(res.body.ok)
              assert.property(res.body, 'data')
              assert.typeOf(res.body.data, 'Object')
              expect(res.body.data).to.containSubset({
                consumableId,
                assayId,
                quantity: initialQuantity,
              })
              assert.property(res.body.data, 'consumableName')
              assert.property(res.body.data, 'unitName')
              assert.property(res.body.data, 'unitShortName')
              assert.property(res.body.data, 'assayName')
              assert.property(res.body.data, 'assayI18nKey')

              server
                .post(path)
                .set('Authorization', `Bearer ${shared.token}`)
                .send({
                  assayId,
                  consumableId,
                  quantity: updatedQuantity,
                })
                .set('Authorization', `Bearer ${shared.token}`)
                .end((err, res) => {
                  assert.equal(
                    res.status,
                    409,
                    'We should not be able to post a duplicate assay consumable'
                  )
                  assert.deepEqual(res.body, {
                    statusCode: 409,
                    error: 'Conflict',
                    message:
                      'There is already an record for this assay and consumable',
                  })

                  server
                    .get(`/api/assay-consumables/${assayId}`)
                    .set('Authorization', `Bearer ${shared.token}`)
                    .end((err, res) => {
                      const newAssayConsumable = _.find(res.body.data, {
                        assayId,
                        consumableId,
                      })
                      assert.equal(newAssayConsumable.quantity, initialQuantity)
                      done()
                    })
                })
            })
        })
      })

      describe('PUT', () => {
        beforeEach(async () =>
          run(async knex => {
            await knex('ConsumableAssay').insert({
              consumableId,
              assayId,
              quantity: initialQuantity,
            })
          })
        )
        afterEach(async () =>
          run(async knex => {
            await knex('ConsumableAssay')
              .where({ consumableId, assayId })
              .delete()
          })
        )
        it('should return the updated assay consumable when using valid token, consumable id and an assay id', done => {
          server
            .put(`${path}/${assayId}/${consumableId}`)
            .send({ quantity: updatedQuantity })
            .set('Authorization', `Bearer ${shared.token}`)
            .end((err, res) => {
              assert.equal(res.status, 200)
              assert.typeOf(res.body, 'Object')
              assert.isTrue(res.body.ok)
              assert.property(res.body, 'data')
              assert.typeOf(res.body.data, 'Object')
              expect(res.body.data).to.containSubset({
                consumableId,
                assayId,
                quantity: updatedQuantity,
              })
              assert.property(res.body.data, 'consumableName')
              assert.property(res.body.data, 'unitName')
              assert.property(res.body.data, 'unitShortName')
              assert.property(res.body.data, 'assayName')
              assert.property(res.body.data, 'assayI18nKey')

              server
                .get(`/api/assay-consumables/${assayId}`)
                .set('Authorization', `Bearer ${shared.token}`)
                .end((err, res) => {
                  const newAssayConsumable = _.find(res.body.data, {
                    assayId,
                    consumableId,
                  })
                  assert.equal(newAssayConsumable.quantity, updatedQuantity)
                  done()
                })
            })
        })
      })

      describe('DELETE', () => {
        beforeEach(async () =>
          run(async knex => {
            await knex('ConsumableAssay').insert({
              consumableId,
              assayId,
              quantity: 1,
            })
          })
        )
        afterEach(async () =>
          run(async knex => {
            await knex('ConsumableAssay')
              .where({ consumableId, assayId })
              .delete()
          })
        )
        it('should remove the assay consumable from the system', done => {
          server
            .delete(`${path}/${assayId}/${consumableId}`)
            .set('Authorization', `Bearer ${shared.token}`)
            .end((err, res) => {
              assert.equal(res.status, 200)
              assert.isTrue(res.body.ok)

              server
                .get(`/api/assay-consumables/${assayId}`)
                .set('Authorization', `Bearer ${shared.token}`)
                .end((err, res) => {
                  const deletedAssayConsumable = _.find(res.body.data, {
                    assayId,
                    consumableId,
                  })
                  assert.isTrue(_.isEmpty(deletedAssayConsumable))
                  done()
                })
            })
        })
      })
    })
  })
})

// -----------------------------------
// helper functions
// -----------------------------------
async function getTestAssayId(knex) {
  const { id: assayId } = await knex('Assay')
    .where({ externalId: 'GxMtbRif' })
    .first('id')
  return assayId
}

async function createTestConsumable(knex) {
  const { id: partnerId } = await knex('Partner')
    .where('name', 'Partner One')
    .first('id')

  const [consumableId] = await knex('Consumable').insert({
    name: 'Test Cartridge',
    unit: 1,
    canExpire: 1,
    manufacturer: 'Daktari',
  })

  await knex('PartnerConsumable').insert({
    partnerId,
    consumableId,
    allowStockUpdateFromActionDashboard: true,
  })
  return consumableId
}

async function cleanUpTestConsumable(knex, consumableId) {
  await knex('PartnerConsumable')
    .where({ consumableId })
    .delete()
  await knex('Consumable')
    .where({ id: consumableId })
    .delete()
}
