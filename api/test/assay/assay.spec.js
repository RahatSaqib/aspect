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

    const hivManagerUsername = 'hiv_manager'
    const hivManagerPassword = 'hiv-manager-pass'
    let hivManagerUserId
    let hivManagerAuthAccessToken
    before(async () => {
      hivManagerUserId = await createUser(
        'Partner One',
        'US',
        hivManagerUsername,
        hivManagerPassword,
        [
          {
            jobFunctionExternalId: 'manager',
            stateName: null,
            lgaName: null,
            siteExternalId: null,
            assayExternalId: null,
            assayTypeExternalId: 'assayTypeCD4',
            deviceTypeExternalId: null,
          },
          {
            jobFunctionExternalId: 'manager',
            stateName: null,
            lgaName: null,
            siteExternalId: null,
            assayExternalId: null,
            assayTypeExternalId: 'assayTypeHivQual',
            deviceTypeExternalId: null,
          },
          {
            jobFunctionExternalId: 'manager',
            stateName: null,
            lgaName: null,
            siteExternalId: null,
            assayExternalId: null,
            assayTypeExternalId: 'assayTypeHivVl',
            deviceTypeExternalId: null,
          },
        ]
      )
      hivManagerAuthAccessToken = await getAccessToken(
        hivManagerUsername,
        hivManagerPassword
      )
    })

    after(async () => removeUser(hivManagerUserId))

    it("should constrain assays returned based on the user's job context", async () => {
      const assayResponse = await server
        .get(path)
        .set('Authorization', `Bearer ${hivManagerAuthAccessToken}`)
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
