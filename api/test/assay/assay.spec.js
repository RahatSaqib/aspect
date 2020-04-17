const supertest = require('supertest')
const chai = require('chai')
const shared = require('../utils/sharedToken')
const { runTestWithKnex } = require('../utils/generatorFunctionUtils')
const { getAccessToken, createUser, removeUser } = require('../utils/authUtils')

const server = supertest.agent('http://localhost:8080')
const { assert, expect } = chai

describe('Assay routes', () => {
  const path = '/api/assay'
  shared.checkToken(server, path)
  describe('GET', () => {
    it('should return a list of assays when using valid token', async () => {
      const assayResponse = await server
        .get(path)
        .set('Authorization', `Bearer ${shared.token}`)
      assert.equal(assayResponse.status, 200)
      assert.typeOf(assayResponse.body, 'Object')
      assert.property(assayResponse.body, 'data')
      assert.typeOf(assayResponse.body.data, 'array')
      assert.isAtLeast(assayResponse.body.data.length, 3)
      assert.property(assayResponse.body.data[0], 'id')
      assert.property(assayResponse.body.data[0], 'assayTypeId')
      assert.property(assayResponse.body.data[0], 'deviceTypeId')
      assert.property(assayResponse.body.data[0], 'name')
      assert.property(assayResponse.body.data[0], 'assayTypeName')
      assert.property(assayResponse.body.data[0], 'deviceTypeName')
      assert.property(assayResponse.body.data[0], 'hasResults')
      assert.property(assayResponse.body.data[0], 'resultDataSchema')
      assert.property(assayResponse.body.data[0], 'assayTypeAbbreviation')
      assert.property(assayResponse.body.data[0], 'abbreviation')
      assert.property(assayResponse.body, 'total')
      expect(assayResponse.body.data).to.containSubset([
        {
          assayTypeName: 'MTB/Rif',
        },
        {
          assayTypeName: 'HIV VL',
        },
      ])
    })

    const tbDiseaseManagerUsername = 'tb_disease_manager'
    const tbDiseaseManagerPassword = 'tb-disease-manager-pass'
    let tbDiseaseManagerUserId
    let tbDiseaseManagerAuthAccessToken

    const hivAssaysManagerUsername = 'hiv_assay_manager'
    const hivAssaysManagerPassword = 'hiv-assay-manager-pass'
    let hivAssaysManagerUserId
    let hivAssaysManagerAuthAccessToken
    before(async () => {
      tbDiseaseManagerUserId = await createUser(
        'Partner One',
        'US',
        tbDiseaseManagerUsername,
        tbDiseaseManagerPassword,
        [
          {
            jobFunctionExternalId: 'manager',
            diseaseExternalId: 'tb',
          },
        ]
      )
      tbDiseaseManagerAuthAccessToken = await getAccessToken(
        tbDiseaseManagerUsername,
        tbDiseaseManagerPassword
      )

      hivAssaysManagerUserId = await createUser(
        'Partner One',
        'US',
        hivAssaysManagerUsername,
        hivAssaysManagerPassword,
        [
          {
            jobFunctionExternalId: 'manager',
            assayTypeExternalId: 'assayTypeCD4',
          },
          {
            jobFunctionExternalId: 'manager',
            assayTypeExternalId: 'assayTypeHivQual',
          },
          {
            jobFunctionExternalId: 'manager',
            assayTypeExternalId: 'assayTypeHivVl',
          },
        ]
      )
      hivAssaysManagerAuthAccessToken = await getAccessToken(
        hivAssaysManagerUsername,
        hivAssaysManagerPassword
      )
    })

    after(async () => {
      await removeUser(hivAssaysManagerUserId)
      await removeUser(tbDiseaseManagerUserId)
    })

    it("should constrain assays returned based on the assays specified in the user's job context", async () => {
      const assayResponse = await server
        .get(path)
        .set('Authorization', `Bearer ${hivAssaysManagerAuthAccessToken}`)
      expect(assayResponse.body.data).to.containSubset([
        {
          assayTypeName: 'HIV VL',
        },
      ])
      expect(assayResponse.body.data).to.not.containSubset([
        {
          assayTypeName: 'MTB/Rif',
        },
      ])
    })

    it("should constrain assays returned based on the diseases specified in the user's job context", async () => {
      const assayResponse = await server
        .get(path)
        .set('Authorization', `Bearer ${tbDiseaseManagerAuthAccessToken}`)
      expect(assayResponse.body.data).to.containSubset([
        {
          assayTypeName: 'MTB/Rif',
        },
      ])
      expect(assayResponse.body.data).to.not.containSubset([
        {
          assayTypeName: 'HIV VL',
        },
      ])
    })

    describe('GET /assay/resultandpatientschema', () => {
      it('should return a list of assays patient and result and schema data', () =>
        runTestWithKnex(async knex => {
          // get an assay with no result/device to make sure it's returned regardless:
          const assayIdsWithDevice = await knex('Result')
            .distinct('assayId')
            .map(a => a.assayId)
          const { id: assayIdWithoutDevice } = await knex('Assay')
            .whereNotIn('id', assayIdsWithDevice)
            .first('id')

          await server
            .get(`${path}/resultandpatientschema`)
            .set('Authorization', `Bearer ${shared.token}`)
            .then(res => {
              assert.equal(res.status, 200)
              assert.typeOf(res.body, 'Array')
              assert.isAbove(res.body.length, 0)
              assert.property(res.body[0], 'assayId')
              assert.property(res.body[0], 'externalId')
              assert.property(res.body[0], 'assayTypeId')
              assert.property(res.body[0], 'name')
              assert.property(res.body[0], 'assayTypeName')
              assert.property(res.body[0], 'deviceTypeName')
              assert.property(res.body[0], 'resultCategory1Label')
              assert.property(res.body[0], 'resultCategory1i18nKey')
              assert.property(res.body[0], 'resultCategory2Label')
              assert.property(res.body[0], 'resultCategory2i18nKey')
              assert.property(res.body[0], 'deviceTypeExternalId')
              assert.property(res.body[0], 'resultDataSchema')
              assert.typeOf(res.body[0].resultDataSchema, 'object')
              assert.property(res.body[0], 'patientDataSchema')
              assert.typeOf(res.body[0].patientDataSchema, 'object')
              assert.property(res.body[0], 'assayTypeAbbreviation')
              assert.property(res.body[0], 'abbreviation')
              assert.property(res.body[0], 'resultCategories')
              assert.typeOf(res.body[0].resultCategories, 'array')
              assert.typeOf(
                res.body.find(a => a.assayId === assayIdWithoutDevice),
                'object'
              )
            })
        }))
    })
  })
})
