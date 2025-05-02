const _ = require('lodash')
const chai = require('chai')
const chaiSubset = require('chai-subset')
const shared = require('../utils/sharedToken')
const { getAccessToken, createUser, removeUser } = require('../utils/authUtils')
const { run } = require('../../src/db')

const server = require('../utils/testUtils')

const { assert, expect } = chai.use(chaiSubset)

describe('Assay Consumable Routes', () => {
  describe('Consumable Type Route', () => {
    const path = '/api/inventory/consumable-types'

    before(() => {
      shared.checkToken(server, path)
    })

    describe('GET', () => {
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

    before(() => {
      shared.checkToken(server, path)
    })

    describe('GET', () => {
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
            assert.property(res.body.data[0], 'effectOnStock')
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
        const tbDiseaseManagerUsername = 'tb_disease_manager'
        const tbDiseaseManagerPassword = 'tb-disease-manager-pass'
        let tbDiseaseManagerUserId
        let tbDiseaseManagerAuthAccessToken

        const hivManagerUsername = 'hiv_manager'
        const hivManagerPassword = 'hiv-manager-pass'
        let hivManagerUserId
        let hivManagerAuthAccessToken
        before(async () => {
          tbDiseaseManagerUserId = await createUser(
            'Partner One',
            'US',
            tbDiseaseManagerUsername,
            tbDiseaseManagerPassword,
            [
              {
                jobFunctionExternalId: 'regionalAdmin',
                diseaseExternalId: 'tb',
              },
            ]
          )
          tbDiseaseManagerAuthAccessToken = await getAccessToken(tbDiseaseManagerUsername, tbDiseaseManagerPassword)

          hivManagerUserId = await createUser('Partner One', 'US', hivManagerUsername, hivManagerPassword, [
            {
              jobFunctionExternalId: 'regionalAdmin',
              assayTypeExternalId: 'assayTypeCD4',
            },
            {
              jobFunctionExternalId: 'regionalAdmin',
              assayTypeExternalId: 'assayTypeHivQual',
            },
            {
              jobFunctionExternalId: 'regionalAdmin',
              assayTypeExternalId: 'assayTypeHivVl',
            },
          ])
          hivManagerAuthAccessToken = await getAccessToken(hivManagerUsername, hivManagerPassword)
        })

        after(async () => {
          await removeUser(hivManagerUserId)
          await removeUser(tbDiseaseManagerUserId)
        })

        it('should return a list of assay consumables when using valid token and an assay id', async () => {
          const consumableTypesResponse = await server
            .get('/api/inventory/consumable-types')
            .set('Authorization', `Bearer ${shared.token}`)
          const gxMtbCartridge = _.find(consumableTypesResponse.body.data, {
            name: 'GeneXpert TB Cartridge',
          })

          const consumableAssaysResponse = await server
            .get(`${path}${gxMtbCartridge.id}`)
            .set('Authorization', `Bearer ${shared.token}`)
          assert.equal(consumableAssaysResponse.status, 200)
          assert.typeOf(consumableAssaysResponse.body, 'Object')
          assert.isTrue(consumableAssaysResponse.body.ok)
          assert.property(consumableAssaysResponse.body, 'data')
          assert.typeOf(consumableAssaysResponse.body.data, 'array')
          assert.isAtLeast(consumableAssaysResponse.body.data.length, 1)
          consumableAssaysResponse.body.data.forEach(assayConsumable => {
            assert.equal(assayConsumable.consumableId, gxMtbCartridge.id)
            assert.property(assayConsumable, 'assayId')
            assert.property(assayConsumable, 'quantity')
            assert.property(assayConsumable, 'consumableName')
            assert.property(assayConsumable, 'unitName')
            assert.property(assayConsumable, 'unitShortName')
            assert.property(assayConsumable, 'assayName')
            assert.property(assayConsumable, 'assayI18nKey')
          })
        })

        it("should constrain consumables returned based on the diseases specified in the user's job context", async () => {
          const consumableTypesResponse = await server
            .get('/api/inventory/consumable-types')
            .set('Authorization', `Bearer ${tbDiseaseManagerAuthAccessToken}`)
          const gxHivVlCartridge = _.find(consumableTypesResponse.body.data, {
            name: 'Xpert HIV-1 Qual Cartridge',
          })
          const gxHivVlCartridgeAssaysResponse = await server
            .get(`${path}${gxHivVlCartridge.id}`)
            .set('Authorization', `Bearer ${tbDiseaseManagerAuthAccessToken}`)
          assert.equal(gxHivVlCartridgeAssaysResponse.body.data.length, 0)
          const gxMtbCartridge = _.find(consumableTypesResponse.body.data, {
            name: 'GeneXpert TB Cartridge',
          })
          const gxMtbCartridgeAssaysResponse = await server
            .get(`${path}${gxMtbCartridge.id}`)
            .set('Authorization', `Bearer ${tbDiseaseManagerAuthAccessToken}`)
          assert.equal(gxMtbCartridgeAssaysResponse.status, 200)
          assert.typeOf(gxMtbCartridgeAssaysResponse.body, 'Object')
          assert.isTrue(gxMtbCartridgeAssaysResponse.body.ok)
          assert.property(gxMtbCartridgeAssaysResponse.body, 'data')
          assert.typeOf(gxMtbCartridgeAssaysResponse.body.data, 'array')
          assert.isAtLeast(gxMtbCartridgeAssaysResponse.body.data.length, 1)
          gxMtbCartridgeAssaysResponse.body.data.forEach(assayConsumable => {
            assert.equal(assayConsumable.consumableId, gxMtbCartridge.id)
            assert.property(assayConsumable, 'assayId')
            assert.property(assayConsumable, 'quantity')
            assert.property(assayConsumable, 'consumableName')
            assert.property(assayConsumable, 'unitName')
            assert.property(assayConsumable, 'unitShortName')
            assert.property(assayConsumable, 'assayName')
            assert.property(assayConsumable, 'assayI18nKey')
          })
        })

        it("should constrain consumables returned based on the assays specified in the user's job context", async () => {
          const consumableTypesResponse = await server
            .get('/api/inventory/consumable-types')
            .set('Authorization', `Bearer ${hivManagerAuthAccessToken}`)
          const gxMtbCartridge = _.find(consumableTypesResponse.body.data, {
            name: 'GeneXpert TB Cartridge',
          })
          const gxTbCartridgeAssaysResponse = await server
            .get(`${path}${gxMtbCartridge.id}`)
            .set('Authorization', `Bearer ${hivManagerAuthAccessToken}`)
          assert.equal(gxTbCartridgeAssaysResponse.body.data.length, 0)
          const gxHivVlCartridge = _.find(consumableTypesResponse.body.data, {
            name: 'Xpert HIV-1 Qual Cartridge',
          })
          const gxHivVlCartridgeAssaysResponse = await server
            .get(`${path}${gxHivVlCartridge.id}`)
            .set('Authorization', `Bearer ${hivManagerAuthAccessToken}`)
          assert.equal(gxHivVlCartridgeAssaysResponse.status, 200)
          assert.typeOf(gxHivVlCartridgeAssaysResponse.body, 'Object')
          assert.isTrue(gxHivVlCartridgeAssaysResponse.body.ok)
          assert.property(gxHivVlCartridgeAssaysResponse.body, 'data')
          assert.typeOf(gxHivVlCartridgeAssaysResponse.body.data, 'array')
          assert.isAtLeast(gxHivVlCartridgeAssaysResponse.body.data.length, 1)
          gxHivVlCartridgeAssaysResponse.body.data.forEach(assayConsumable => {
            assert.equal(assayConsumable.consumableId, gxHivVlCartridge.id)
            assert.property(assayConsumable, 'assayId')
            assert.property(assayConsumable, 'quantity')
            assert.property(assayConsumable, 'consumableName')
            assert.property(assayConsumable, 'unitName')
            assert.property(assayConsumable, 'unitShortName')
            assert.property(assayConsumable, 'assayName')
            assert.property(assayConsumable, 'assayI18nKey')
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

      before(() =>
        run(async knex => {
          assayId = await getTestAssayId(knex)
          consumableId = await createTestConsumable(knex)
        })
      )

      after(() =>
        run(async knex => {
          await cleanUpTestConsumable(knex, consumableId)
        })
      )

      describe('POST', () => {
        afterEach(() =>
          run(async knex => {
            await knex('ConsumableAssay').where({ consumableId, assayId }).delete()
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
                  assert.equal(res.status, 409, 'We should not be able to post a duplicate assay consumable')
                  assert.deepEqual(res.body, {
                    statusCode: 409,
                    error: 'Conflict',
                    message: 'There is already an record for this assay and consumable',
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
        beforeEach(() =>
          run(async knex => {
            await knex('ConsumableAssay').insert({
              consumableId,
              assayId,
              quantity: initialQuantity,
            })
          })
        )
        afterEach(() =>
          run(async knex => {
            await knex('ConsumableAssay').where({ consumableId, assayId }).delete()
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
        beforeEach(() =>
          run(async knex => {
            await knex('ConsumableAssay').insert({
              consumableId,
              assayId,
              quantity: 1,
            })
          })
        )
        afterEach(() =>
          run(async knex => {
            await knex('ConsumableAssay').where({ consumableId, assayId }).delete()
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
  const { id: assayId } = await knex('Assay').where({ externalId: 'GxMtbRif' }).first('id')
  return assayId
}

async function createTestConsumable(knex) {
  const { id: partnerId } = await knex('Partner').where('name', 'Partner One').first('id')

  const [consumableId] = await knex('Consumable').insert({
    name: 'Test Cartridge',
    unit: 1,
    canExpire: 1,
    manufacturer: 'Daktari',
    externalId: 'DaktariCartridge',
    i18nKey: 'DaktariCartridge',
  })

  await knex('PartnerConsumable').insert({
    partnerId,
    consumableId,
    allowStockUpdateFromActionDashboard: true,
  })
  return consumableId
}

async function cleanUpTestConsumable(knex, consumableId) {
  await knex('PartnerConsumable').where({ consumableId }).delete()
  await knex('Consumable').where({ id: consumableId }).delete()
}
