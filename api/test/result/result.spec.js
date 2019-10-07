const supertest = require('supertest')
const chai = require('chai')
const _ = require('lodash')
const dateFormat = require('date-fns/format')
const { addMinutes, subMonths, endOfMonth, parseISO } = require('date-fns')

const shared = require('../utils/sharedToken')
const { runTestWithKnex } = require('../utils/generatorFunctionUtils')

const server = supertest.agent('http://localhost:8080')
const { assert } = chai

const { getCommCarePayload } = require('../deviceApi/commcare/commcare_utils')
const {
  createTestContext,
  getDeviceFromApiKey,
  getLastResultId,
  getLastResult,
} = require('../deviceApi/utils')

const getClinicianAccessToken = () =>
  server
    .post('/api/auth')
    .send({
      name: 'clinician',
      password: 'test07',
      clientName: 'Mocha web',
    })
    .then(res => res.body.access)

describe('Result routes', () => {
  const path = '/api/result'
  let resultId = 1
  let assayId = 1
  let initialResultWorkflowStatus = ''
  let initialResultWorkflowStatusName = ''
  const reason = 'testing'
  const operator = 'Tester'
  const changedOn = new Date(
    dateFormat(new Date(), "yyyy-MM-dd HH:mm:ss.000'Z'")
  )

  let clinicianAccessToken = ''
  before(async () => {
    clinicianAccessToken = await getClinicianAccessToken()
  })

  describe('GET', () => {
    shared.checkToken(server, path)

    it('should return a list of results', () =>
      runTestWithKnex(async knex => {
        initialResultWorkflowStatusName = await server
          .get(path)
          .set('Authorization', `Bearer ${shared.token}`)
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
            assert.property(res.body, 'data')
            assert.typeOf(res.body.data, 'array')
            assert.isAtLeast(res.body.data.length, 5)
            assert.property(res.body.data[0], 'id')
            assert.property(res.body.data[0], 'endedOn')
            assert.property(res.body.data[0], 'deviceName')
            assert.property(res.body.data[0], 'sampleOriginSiteName')
            assert.property(res.body.data[0], 'countryName')
            assert.property(res.body.data[0], 'stateName')
            assert.property(res.body.data[0], 'lgaName')
            assert.property(res.body.data[0], 'sampleId')
            assert.property(res.body.data[0], 'sampleGroup')
            assert.property(res.body.data[0], 'sampleOriginSiteName')
            assert.property(res.body.data[0], 'resultText')
            assert.property(res.body.data[0], 'resultWorkflowStatus')
            assert.property(res.body.data[0], 'patientId')
            assert.property(res.body.data[0], 'assayName')
            assert.property(res.body, 'total')
            ;[
              {
                id: resultId,
                assayId,
                resultWorkflowStatus: initialResultWorkflowStatus,
              },
            ] = res.body.data
            return res.body.data[0].resultWorkflowStatus
          })

        initialResultWorkflowStatus = (await knex
          .from('ResultWorkflowStatus')
          .where({ name: initialResultWorkflowStatusName })
          .first('externalId')).externalId
      }))

    it('should return a list of results with assay-specific fields if TB assay is requested', done => {
      server
        .get(`${path}?assayId=${assayId}`)
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.isAtLeast(res.body.data.length, 5)
          assert.property(res.body.data[0], 'id')
          assert.property(res.body.data[0], 'endedOn')
          assert.property(res.body.data[0], 'deviceName')
          assert.property(res.body.data[0], 'countryName')
          assert.property(res.body.data[0], 'stateName')
          assert.property(res.body.data[0], 'lgaName')
          assert.property(res.body.data[0], 'sampleId')
          assert.property(res.body.data[0], 'sampleGroup')
          assert.property(res.body.data[0], 'sampleOriginSiteName')
          assert.property(res.body.data[0], 'patientId')
          assert.property(res.body.data[0], 'assayName')
          assert.property(res.body.data[0], 'resultCategory1Name')
          assert.property(res.body.data[0], 'resultCategory2Name')
          assert.property(res.body.data[0], 'resultText')
          assert.property(res.body.data[0], 'resultWorkflowStatus')
          assert.property(res.body, 'total')
          assert.typeOf(res.body.extraColumns, 'array')
          done()
        })
    })

    it('should return a single result', done => {
      server
        .get(`${path}/${resultId}`)
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'Object')
          assert.property(res.body.data, 'id')
          assert.property(res.body.data, 'endedOn')
          assert.property(res.body.data, 'deviceName')
          assert.property(res.body.data, 'countryName')
          assert.property(res.body.data, 'stateName')
          assert.property(res.body.data, 'lgaName')
          assert.property(res.body.data, 'resultCategory1Name')
          assert.property(res.body.data, 'resultCategory2Name')
          assert.property(res.body.data, 'resultWorkflowStatusId')
          assert.property(res.body.data, 'resultWorkflowStatus')
          assert.property(res.body.data, 'resultWorkflowStatusExternalId')
          assert.property(res.body.data, 'resultData')
          assert.typeOf(res.body.data.resultData, 'Object')
          assert.property(res.body.data, 'sampleId')
          assert.property(res.body.data, 'sampleGroup')
          assert.property(res.body.data, 'patientId')
          assert.property(res.body.data, 'siteName')
          assert.property(res.body.data, 'assayVersion')
          assert.property(res.body.data, 'consumableSerial')
          assert.property(res.body.data, 'consumableLot')
          assert.property(res.body.data, 'consumableExpirationDate')
          assert.property(res.body.data, 'instrumentSerial')
          assert.property(res.body.data, 'moduleName')
          assert.property(res.body.data, 'moduleSerial')
          assert.property(res.body.data, 'researchId')
          assert.property(res.body.data, 'senderVersion')
          assert.property(res.body.data, 'senderOperator')
          assert.property(res.body.data, 'notes')
          assert.property(res.body.data, 'errorCode')
          assert.property(res.body.data, 'errorNotes')
          assert.property(res.body.data, 'createdOn')
          assert.property(res.body.data, 'updatedOn')
          assert.property(res.body.data, 'assayId')
          assert.property(res.body.data, 'assay')
          assert.typeOf(res.body.data.assay, 'Object')
          assert.property(res.body.data.assay, 'id')
          assert.property(res.body.data.assay, 'name')
          assert.property(res.body.data.assay, 'i18nKey')
          assert.property(res.body.data.assay, 'assayTypeId')
          assert.property(res.body.data.assay, 'deviceTypeId')
          assert.property(res.body.data.assay, 'resultCategory1Label')
          assert.property(res.body.data.assay, 'resultCategory1i18nKey')
          assert.property(res.body.data.assay, 'resultCategory2Label')
          assert.property(res.body.data.assay, 'resultCategory2i18nKey')
          assert.property(res.body.data.assay, 'resultDataSchema')
          assert.typeOf(res.body.data.assay.resultDataSchema, 'Object')
          assert.property(res.body.data, 'files')
          done()
        })
    })

    it('should return a list of results that the clinician has access to via sample origin site', done => {
      server
        .get(`${path}?assayId=${assayId}`)
        .set('Authorization', `Bearer ${clinicianAccessToken}`)
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.equal(res.body.data.length, 3)
          assert.property(res.body.data[0], 'id')
          assert.property(res.body.data[0], 'endedOn')
          assert.property(res.body.data[0], 'deviceName')
          assert.property(res.body.data[0], 'countryName')
          assert.property(res.body.data[0], 'stateName')
          assert.property(res.body.data[0], 'lgaName')
          assert.property(res.body.data[0], 'sampleId')
          assert.property(res.body.data[0], 'sampleGroup')
          assert.property(res.body.data[0], 'sampleOriginSiteName')
          assert.property(res.body.data[0], 'patientId')
          assert.property(res.body.data[0], 'assayName')
          assert.property(res.body.data[0], 'resultCategory1Name')
          assert.property(res.body.data[0], 'resultCategory2Name')
          assert.property(res.body.data[0], 'resultText')
          assert.property(res.body.data[0], 'resultWorkflowStatus')
          assert.property(res.body, 'total')
          assert.typeOf(res.body.extraColumns, 'array')

          const originSites = _.uniqBy(res.body.data, 'sampleOriginSiteName')
          assert.equal(originSites.length, 1)
          assert.equal(originSites[0].sampleOriginSiteName, 'Dayton Ohio')
          ;[{ id: resultId }] = res.body.data

          done()
        })
    })

    it('should return a single result that the clinician has access to via sample origin site', done => {
      server
        .get(`${path}/${resultId}`)
        .set('Authorization', `Bearer ${clinicianAccessToken}`)
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'Object')
          assert.property(res.body.data, 'id')
          assert.property(res.body.data, 'endedOn')
          assert.property(res.body.data, 'deviceName')
          assert.property(res.body.data, 'countryName')
          assert.property(res.body.data, 'stateName')
          assert.property(res.body.data, 'lgaName')
          assert.property(res.body.data, 'resultCategory1Name')
          assert.property(res.body.data, 'resultCategory2Name')
          assert.property(res.body.data, 'resultWorkflowStatusId')
          assert.property(res.body.data, 'resultWorkflowStatus')
          assert.property(res.body.data, 'resultWorkflowStatusExternalId')
          assert.property(res.body.data, 'resultData')
          assert.typeOf(res.body.data.resultData, 'Object')
          assert.property(res.body.data, 'sampleId')
          assert.property(res.body.data, 'sampleGroup')
          assert.property(res.body.data, 'patientId')
          assert.property(res.body.data, 'siteName')
          assert.property(res.body.data, 'assayVersion')
          assert.property(res.body.data, 'consumableSerial')
          assert.property(res.body.data, 'consumableLot')
          assert.property(res.body.data, 'consumableExpirationDate')
          assert.property(res.body.data, 'instrumentSerial')
          assert.property(res.body.data, 'moduleName')
          assert.property(res.body.data, 'moduleSerial')
          assert.property(res.body.data, 'researchId')
          assert.property(res.body.data, 'senderVersion')
          assert.property(res.body.data, 'senderOperator')
          assert.property(res.body.data, 'notes')
          assert.property(res.body.data, 'errorCode')
          assert.property(res.body.data, 'errorNotes')
          assert.property(res.body.data, 'createdOn')
          assert.property(res.body.data, 'updatedOn')
          assert.property(res.body.data, 'assayId')
          assert.property(res.body.data, 'assay')
          assert.typeOf(res.body.data.assay, 'Object')
          assert.property(res.body.data.assay, 'id')
          assert.property(res.body.data.assay, 'name')
          assert.property(res.body.data.assay, 'i18nKey')
          assert.property(res.body.data.assay, 'assayTypeId')
          assert.property(res.body.data.assay, 'deviceTypeId')
          assert.property(res.body.data.assay, 'resultCategory1Label')
          assert.property(res.body.data.assay, 'resultCategory1i18nKey')
          assert.property(res.body.data.assay, 'resultCategory2Label')
          assert.property(res.body.data.assay, 'resultCategory2i18nKey')
          assert.property(res.body.data.assay, 'resultDataSchema')
          assert.typeOf(res.body.data.assay.resultDataSchema, 'Object')
          assert.property(res.body.data, 'files')
          done()
        })
    })
  })

  describe('PUT', () => {
    after(async () =>
      runTestWithKnex(async knex => {
        await knex('ResultTreatmentStatusLog')
          .where('resultId', resultId)
          .delete()
      })
    )
    it('Should update result status given a resultId', done => {
      const updateWithExternalId = {
        resultWorkflowStatusId: null,
        externalId: 'Validated',
        reason,
        operator,
        changedOn,
      }
      const updateWithId = {
        resultWorkflowStatusId: 1,
        operator: 'operator 1',
        reason: 'reason 1',
        externalId: null,
      }

      // update with external ID
      server
        .put(`${path}/workflow-status/${resultId}`)
        .send(updateWithExternalId)
        .set('Authorization', `Bearer${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'Object')
          assert.typeOf(res.body.data.assay, 'Object')
          assert.typeOf(res.body.data.assay.resultDataSchema, 'Object')
          assert.typeOf(res.body.data.resultData, 'Object')
          const resultFieldNames = [
            'id',
            'endedOn',
            'deviceName',
            'countryName',
            'stateName',
            'lgaName',
            'resultCategory1Name',
            'resultCategory2Name',
            'resultData',
            'sampleId',
            'sampleGroup',
            'patientId',
            'siteName',
            'assayVersion',
            'consumableSerial',
            'consumableLot',
            'consumableExpirationDate',
            'instrumentSerial',
            'moduleName',
            'moduleSerial',
            'researchId',
            'senderVersion',
            'senderOperator',
            'notes',
            'errorCode',
            'errorNotes',
            'createdOn',
            'updatedOn',
            'assayId',
            'assay',
            'resultWorkflowLogReason',
            'resultWorkflowLogCreatedOn',
            'resultWorkflowLogOperator',
            'resultTreatmentMethod',
            'resultTreatmentData',
            'resultNotes',
          ]
          _.each(resultFieldNames, fieldName => {
            assert.property(res.body.data, fieldName)
          })
          // check the updated fieldName
          assert.equal(res.body.data.resultWorkflowStatus, 'Validated')
          assert.equal(res.body.data.resultWorkflowLogReason, reason)
          assert.equal(res.body.data.resultWorkflowLogOperator, operator)
          assert.closeTo(
            new Date(res.body.data.updatedOn).getTime(),
            new Date().getTime(),
            5000
          )
          assert.equal(
            dateFormat(
              parseISO(res.body.data.resultWorkflowLogChangedOn),
              'yyyy-MM-dd HH:mm:ss'
            ),
            dateFormat(changedOn, 'yyyy-MM-dd HH:mm:ss')
          )

          // update with resultWorkflowStatusId
          server
            .put(`${path}/workflow-status/${resultId}`)
            .send(updateWithId)
            .set('Authorization', `Bearer${shared.token}`)
            .end((err, res) => {
              assert.equal(res.status, 200)
              assert.typeOf(res.body, 'Object')
              assert.property(res.body, 'data')
              assert.typeOf(res.body.data, 'Object')
              assert.typeOf(res.body.data.assay, 'Object')
              assert.typeOf(res.body.data.assay.resultDataSchema, 'Object')
              assert.typeOf(res.body.data.resultData, 'Object')
              const resultFieldNames = [
                'id',
                'endedOn',
                'deviceName',
                'countryName',
                'stateName',
                'lgaName',
                'resultCategory1Name',
                'resultCategory2Name',
                'resultData',
                'sampleId',
                'sampleGroup',
                'patientId',
                'siteName',
                'assayVersion',
                'consumableSerial',
                'consumableLot',
                'consumableExpirationDate',
                'instrumentSerial',
                'moduleName',
                'moduleSerial',
                'researchId',
                'senderVersion',
                'senderOperator',
                'notes',
                'errorCode',
                'errorNotes',
                'createdOn',
                'updatedOn',
                'assayId',
                'assay',
              ]
              _.each(resultFieldNames, fieldName => {
                assert.property(res.body.data, fieldName)
              })

              // check if resultWorkflowStatus was updated
              assert.equal(res.body.data.resultWorkflowStatus, 'OK')

              // Check if update persisted
              server
                .get(`/api/result/${resultId}`)
                .set('Authorization', `Bearer${shared.token}`)
                .end((err, res) => {
                  assert.equal(res.body.data.resultWorkflowStatus, 'OK')

                  // Clean Up: Update resultWorkflowStatus with original status
                  server
                    .put(`${path}/workflow-status/${resultId}`)
                    .send({
                      resultWorkflowStatusId: null,
                      externalId: initialResultWorkflowStatus,
                    })
                    .set('Authorization', `Bearer${shared.token}`)
                    .end((err, res) => {
                      assert.equal(
                        res.body.data.resultWorkflowStatus,
                        initialResultWorkflowStatusName
                      )
                      done()
                    })
                })
            })
        })
    })

    // ------------------------------------------------------------------------
    // helper function
    const baseTreatmentStatusAssertion = res => {
      assert.equal(res.status, 200)
      assert.typeOf(res.body, 'Object')
      assert.property(res.body, 'data')
      assert.typeOf(res.body.data, 'Object')
      assert.typeOf(res.body.data.assay, 'Object')
      assert.typeOf(res.body.data.assay.resultDataSchema, 'Object')
      assert.typeOf(res.body.data.resultData, 'Object')
      const resultFieldNames = [
        'id',
        'endedOn',
        'deviceName',
        'countryName',
        'stateName',
        'lgaName',
        'resultCategory1Name',
        'resultCategory2Name',
        'resultData',
        'sampleId',
        'sampleGroup',
        'patientId',
        'siteName',
        'assayVersion',
        'consumableSerial',
        'consumableLot',
        'consumableExpirationDate',
        'instrumentSerial',
        'moduleName',
        'moduleSerial',
        'researchId',
        'senderVersion',
        'senderOperator',
        'notes',
        'errorCode',
        'errorNotes',
        'createdOn',
        'updatedOn',
        'assayId',
        'assay',
      ]
      _.each(resultFieldNames, fieldName => {
        assert.property(res.body.data, fieldName)
      })
    }

    it('Should update result treatment status given a resultId - with externalId', done => {
      const changedOn = new Date()
      const updateWithExternalId = {
        externalId: 'AwaitingTreatment',
        data: 'should be treated',
        method: 'sms',
        changedOn,
      }
      // update with external ID
      server
        .put(`${path}/treatment-status/${resultId}`)
        .send(updateWithExternalId)
        .set('Authorization', `Bearer${shared.token}`)
        .end((err, res) => {
          baseTreatmentStatusAssertion(res)

          const { treatmentStatus } = res.body.data
          // check the updated fieldName
          assert.equal(treatmentStatus.externalId, 'AwaitingTreatment')

          done()
        })
    })

    it('Should update result treatment status given a resultId - with resultTreatmentStatusId', done => {
      const changedOn = addMinutes(new Date(), 1)
      const updateWithId = {
        resultTreatmentStatusId: 2,
        data: 'should be treated',
        method: 'sms',
        changedOn,
      }
      // update with resultTreatmentStatusId
      server
        .put(`${path}/treatment-status/${resultId}`)
        .send(updateWithId)
        .set('Authorization', `Bearer${shared.token}`)
        .end((err, res) => {
          baseTreatmentStatusAssertion(res)

          const { treatmentStatus } = res.body.data

          // check if resultWorkflowStatus was updated
          assert.equal(treatmentStatus.externalId, 'OnTreatment')

          done()
        })
    })

    it('Should update result treatment status given a resultId - set resultNotes', done => {
      const changedOn = addMinutes(new Date(), 2)
      const updateWithNull = {
        resultTreatmentStatusId: null,
        data: 'should be treated',
        method: 'sms',
        changedOn,
      }
      // set to null
      server
        .put(`${path}/treatment-status/${resultId}`)
        .send(updateWithNull)
        .set('Authorization', `Bearer${shared.token}`)
        .end((err, res) => {
          baseTreatmentStatusAssertion(res)

          assert.equal(res.body.data.resultTreatmentData, 'should be treated')

          done()
        })
    })

    describe('Form data', () => {
      const context = createTestContext(server, {
        user: 'gates_rdt',
        password: 'gates2018',
        type: 'CommCareApp',
        partner: 'GatesRDT',
        site: 'commcare',
      })
      const { runTest } = context
      let resultId
      let result
      let apiKey

      beforeEach(async () => {
        const commcarePluginPath = '/device/plugin/commcare'
        await context.createSites(['commcare'])
        await context.createDeviceApiKey()

        return runTest(async knex => {
          apiKey = context.apiKey // eslint-disable-line prefer-destructuring
          await server
            .post(commcarePluginPath)
            .auth('commcare_test', apiKey.token)
            .send(
              getCommCarePayload({
                resultText: 'negative',
                age: 28,
                gender: 'male',
              })
            )
            .then(res => {
              assert.equal(res.status, 200)
              assert.typeOf(res.body, 'Object')
            })
          const device = await getDeviceFromApiKey(knex, apiKey)
          resultId = await getLastResultId(knex, device.id)
          result = await getLastResult(knex, device.id)
          assert.isNull(result.formData)
        })
      })

      afterEach(context.afterEach)

      it('Should save values to the formData field in the result', async () =>
        runTestWithKnex(async knex => {
          let response = await server
            .put(`${path}/form-data/${resultId}`)
            .send({
              expertInterpretation: 'positive',
            })
            .set('Authorization', context.clientAuth)
          assert.deepEqual(response.body.data.formData, {
            expertInterpretation: 'positive',
          })
          assert.equal(response.body.data.id, resultId)
          let resultFromDatabase = await knex('Result')
            .where('id', resultId)
            .first('formData')
          assert.deepEqual(
            response.body.data.formData,
            JSON.parse(resultFromDatabase.formData)
          )

          response = await server
            .put(`${path}/form-data/${resultId}`)
            .send({
              expertInterpretation: null,
            })
            .set('Authorization', context.clientAuth)
          assert.deepEqual(response.body.data.formData, {
            expertInterpretation: null,
          })
          assert.equal(response.body.data.id, resultId)
          resultFromDatabase = await knex('Result')
            .where('id', resultId)
            .first('formData')
          assert.deepEqual(
            response.body.data.formData,
            JSON.parse(resultFromDatabase.formData)
          )

          response = await server
            .put(`${path}/form-data/${resultId}`)
            .send({
              expertInterpretation: 'negative',
            })
            .set('Authorization', context.clientAuth)
          assert.deepEqual(response.body.data.formData, {
            expertInterpretation: 'negative',
          })
          assert.equal(response.body.data.id, resultId)
          resultFromDatabase = await knex('Result')
            .where('id', resultId)
            .first('formData')
          assert.deepEqual(
            response.body.data.formData,
            JSON.parse(resultFromDatabase.formData)
          )

          response = await server
            .put(`${path}/form-data/${resultId}`)
            .send({})
            .set('Authorization', context.clientAuth)
          assert.deepEqual(response.body.data.formData, {
            expertInterpretation: 'negative',
          })
          assert.equal(response.body.data.id, resultId)
          resultFromDatabase = await knex('Result')
            .where('id', resultId)
            .first('formData')
          assert.deepEqual(
            response.body.data.formData,
            JSON.parse(resultFromDatabase.formData)
          )
        }))

      it("Should NOT save values to the formData field in the result when field sent is not in the assay's form schema", async () =>
        runTestWithKnex(async knex => {
          const response = await server
            .put(`${path}/form-data/${resultId}`)
            .send({
              someUndefinedField: 'positive',
              anotherUndefinedField: 'another value',
            })
            .set('Authorization', context.clientAuth)
          assert.equal(response.statusCode, 400)
          const resultFromDatabase = await knex('Result')
            .where('id', resultId)
            .first('formData')
          assert.isNull(resultFromDatabase.formData)
        }))

      it("Should NOT save values to the formData field in the result when value is not in the selector field's options list", async () =>
        runTestWithKnex(async knex => {
          const response = await server
            .put(`${path}/form-data/${resultId}`)
            .send({
              expertInterpretation: 'unknown option',
            })
            .set('Authorization', context.clientAuth)
          assert.equal(response.statusCode, 400)
          const resultFromDatabase = await knex('Result')
            .where('id', resultId)
            .first('formData')
          assert.isNull(resultFromDatabase.formData)
        }))
    })
  })
})

describe('Result type routes', () => {
  const path = '/api/result/result-types'

  describe('GET', () => {
    shared.checkToken(server, path)

    it('should return a list of result types when using valid token', done => {
      server
        .get(path)
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.isAtLeast(res.body.data.length, 5)
          assert.property(res.body.data[0], 'id')
          assert.property(res.body.data[0], 'name')
          assert.property(res.body, 'total')
          done()
        })
    })
  })
})

describe('Result Workflow Status Log', () => {
  const resultId = 1
  const path = `/api/result/workflow-status-logs/${resultId}`

  describe('GET', () => {
    shared.checkToken(server, path)

    it('should return a list of Result Workflow Status Logs (when using valid token)', done => {
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
          assert.property(res.body.data[0], 'changedOn')
          assert.property(res.body.data[0], 'statusName')
          assert.property(res.body.data[0], 'operator')
          assert.property(res.body, 'total')
          done()
        })
    })
  })
})

describe('Result download routes', () => {
  const path = '/api/result/download'

  let clinicianAccessToken = ''
  before(async () => {
    clinicianAccessToken = await getClinicianAccessToken()
  })

  afterEach(() =>
    runTestWithKnex(async knex => {
      await knex('ResultDownloadLog').delete()
    })
  )
  describe('GET', () => {
    shared.checkToken(server, path)

    it('should return a paged list of results, including all result details', () =>
      runTestWithKnex(knex => {
        server
          .get(`${path}?size=1&deviceType=DaktariVirology`)
          .set('Authorization', `Bearer ${shared.token}`)
          .end(async (err, res) => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')

            assert.property(res.body, 'ok')
            assert.property(res.body, 'total')
            assert.property(res.body, 'length')
            assert.property(res.body, 'data')

            assert.equal(res.body.ok, true)
            assert.isAtLeast(res.body.total, 2)
            assert.equal(res.body.length, 1)

            assert.typeOf(res.body.data, 'array')
            assert.equal(res.body.data.length, 1)

            assert.property(res.body.data[0], 'id')
            assert.property(res.body.data[0], 'externalId')
            assert.property(res.body.data[0], 'startedOn')
            assert.property(res.body.data[0], 'endedOn')
            assert.property(res.body.data[0], 'createdOn')
            assert.property(res.body.data[0], 'updatedOn')
            assert.property(res.body.data[0], 'longitude')
            assert.property(res.body.data[0], 'latitude')
            assert.property(res.body.data[0], 'assayExternalId')
            assert.property(res.body.data[0], 'siteName')
            assert.property(res.body.data[0], 'deviceName')
            assert.property(res.body.data[0], 'resultCategory1ExternalId')
            assert.property(res.body.data[0], 'resultCategory2ExternalId')
            assert.property(res.body.data[0], 'workflowStatus')
            assert.equal(
              res.body.data[0].workflowStatus.externalId,
              'Delivered'
            )

            assert.property(res.body.data[0], 'treatmentStatus')
            assert.property(res.body.data[0], 'patientData')
            assert.property(res.body.data[0], 'resultData')
            assert.property(res.body.data[0], 'formData')
            assert.property(res.body.data[0], 'researchId')
            assert.property(res.body.data[0], 'senderVersion')
            assert.property(res.body.data[0], 'senderOperator')
            assert.property(res.body.data[0], 'notes')
            assert.property(res.body.data[0], 'errorCode')
            assert.property(res.body.data[0], 'errorNotes')
            assert.property(res.body.data[0], 'sample')

            assert.property(res.body.data[0], 'followUps')
            assert.typeOf(res.body.data[0].followUps, 'array')
            assert.property(res.body.data[0].followUps[0], 'id')
            assert.property(res.body.data[0].followUps[0], 'externalId')
            assert.property(res.body.data[0].followUps[0], 'i18nKey')
            assert.property(
              res.body.data[0].followUps[0],
              'followUpTypeExternalId'
            )
            assert.property(
              res.body.data[0].followUps[0],
              'followUpTypei18nKey'
            )
            assert.property(res.body.data[0].followUps[0], 'followUpTypeName')
            assert.property(res.body.data[0].followUps[0], 'date')
            assert.property(res.body.data[0].followUps[0], 'createdOn')
            assert.property(res.body.data[0].followUps[0], 'updatedOn')

            assert.equal(Object.keys(res.body.data[0]).length, 26)
            // check if the download is register in the table.
            const { count: totalResult } = await knex('ResultDownloadLog')
              .where('resultId', res.body.data[0].id)
              .count('id as count')
              .first()

            assert.isAtLeast(totalResult, 1)
          })
      }))

    it('should test querying different results with different optional parameters', done => {
      const resultCategories = [
        'Detected',
        'Invalid',
        'Error',
        'Acknowledged',
        'Processed',
      ]
      server
        .get(
          `${path}?size=1&deviceType=DaktariVirology&resultCategories=${resultCategories.join(
            ','
          )}`
        )
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')

          assert.property(res.body, 'ok')
          assert.property(res.body, 'total')
          assert.property(res.body, 'length')
          assert.property(res.body, 'data')

          assert.equal(res.body.ok, true)
          assert.isAtLeast(res.body.total, 1)
          assert.equal(res.body.length, 1)

          assert.typeOf(res.body.data, 'array')
          assert.equal(res.body.data.length, 1)

          assert.property(res.body.data[0], 'id')
          assert.property(res.body.data[0], 'externalId')
          assert.property(res.body.data[0], 'startedOn')
          assert.property(res.body.data[0], 'endedOn')
          assert.property(res.body.data[0], 'createdOn')
          assert.property(res.body.data[0], 'updatedOn')
          assert.property(res.body.data[0], 'longitude')
          assert.property(res.body.data[0], 'latitude')
          assert.property(res.body.data[0], 'assayExternalId')
          assert.property(res.body.data[0], 'siteName')
          assert.property(res.body.data[0], 'deviceName')
          assert.property(res.body.data[0], 'resultCategory1ExternalId')
          assert.property(res.body.data[0], 'resultCategory2ExternalId')
          assert.property(res.body.data[0], 'workflowStatus')
          assert.equal(res.body.data[0].workflowStatus.externalId, 'Delivered')
          assert.property(res.body.data[0], 'treatmentStatus')
          assert.property(res.body.data[0], 'patientData')
          assert.property(res.body.data[0], 'resultData')
          assert.property(res.body.data[0], 'formData')
          assert.property(res.body.data[0], 'researchId')
          assert.property(res.body.data[0], 'senderVersion')
          assert.property(res.body.data[0], 'senderOperator')
          assert.property(res.body.data[0], 'notes')
          assert.property(res.body.data[0], 'errorCode')
          assert.property(res.body.data[0], 'errorNotes')
          assert.property(res.body.data[0], 'sample')

          assert.property(res.body.data[0], 'followUps')
          assert.typeOf(res.body.data[0].followUps, 'array')
          assert.property(res.body.data[0].followUps[0], 'id')
          assert.property(res.body.data[0].followUps[0], 'externalId')
          assert.property(res.body.data[0].followUps[0], 'i18nKey')
          assert.property(
            res.body.data[0].followUps[0],
            'followUpTypeExternalId'
          )
          assert.property(res.body.data[0].followUps[0], 'followUpTypei18nKey')
          assert.property(res.body.data[0].followUps[0], 'followUpTypeName')
          assert.property(res.body.data[0].followUps[0], 'date')
          assert.property(res.body.data[0].followUps[0], 'createdOn')
          assert.property(res.body.data[0].followUps[0], 'updatedOn')

          assert.equal(Object.keys(res.body.data[0]).length, 26)
        })

      server
        .get(
          `${path}?size=1&deviceType=DaktariVirology&assayTypeAbbreviations=HCV,Ebola,HIV`
        )
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')

          assert.property(res.body, 'ok')
          assert.property(res.body, 'total')
          assert.property(res.body, 'length')
          assert.property(res.body, 'data')
          assert.equal(res.body.ok, true)
          assert.isAtLeast(res.body.total, 2)
          assert.equal(res.body.length, 1)

          assert.typeOf(res.body.data, 'array')
          assert.equal(res.body.data.length, 1)

          assert.property(res.body.data[0], 'id')
          assert.property(res.body.data[0], 'externalId')
          assert.property(res.body.data[0], 'startedOn')
          assert.property(res.body.data[0], 'endedOn')
          assert.property(res.body.data[0], 'createdOn')
          assert.property(res.body.data[0], 'updatedOn')
          assert.property(res.body.data[0], 'longitude')
          assert.property(res.body.data[0], 'latitude')
          assert.property(res.body.data[0], 'assayExternalId')
          assert.property(res.body.data[0], 'siteName')
          assert.property(res.body.data[0], 'deviceName')
          assert.property(res.body.data[0], 'resultCategory1ExternalId')
          assert.property(res.body.data[0], 'resultCategory2ExternalId')
          assert.property(res.body.data[0], 'workflowStatus')
          assert.property(res.body.data[0], 'treatmentStatus')
          assert.property(res.body.data[0], 'patientData')
          assert.property(res.body.data[0], 'resultData')
          assert.property(res.body.data[0], 'formData')
          assert.property(res.body.data[0], 'researchId')
          assert.property(res.body.data[0], 'senderVersion')
          assert.property(res.body.data[0], 'senderOperator')
          assert.property(res.body.data[0], 'notes')
          assert.property(res.body.data[0], 'errorCode')
          assert.property(res.body.data[0], 'errorNotes')
          assert.property(res.body.data[0], 'sample')
          assert.equal(res.body.data[0].workflowStatus.externalId, 'Delivered')
        })
      server
        .get(`${path}?size=1&workflowStatus=OK`)
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')

          assert.property(res.body, 'ok')
          assert.property(res.body, 'total')
          assert.property(res.body, 'length')
          assert.property(res.body, 'data')

          assert.equal(res.body.ok, true)
          assert.isAtLeast(res.body.total, 0)
          assert.equal(res.body.length, 0)

          assert.typeOf(res.body.data, 'array')
          assert.equal(res.body.data.length, 0)
        })
      server
        .get(`${path}?size=1&treatmentStatus=OnTreatment`)
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'ok')
          assert.property(res.body, 'total')
          assert.property(res.body, 'length')
          assert.property(res.body, 'data')

          assert.equal(res.body.ok, true)
          assert.isAtLeast(res.body.total, 0)
          assert.equal(res.body.length, 0)

          assert.typeOf(res.body.data, 'array')
          assert.equal(res.body.data.length, 0)
        })
      server
        .get(`${path}?size=1&patientSample=-&deviceType=DaktariVirology`)
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')

          assert.property(res.body, 'ok')
          assert.property(res.body, 'total')
          assert.property(res.body, 'length')
          assert.property(res.body, 'data')

          assert.equal(res.body.ok, true)
          assert.isAtLeast(res.body.total, 1)
          assert.equal(res.body.length, 1)

          assert.typeOf(res.body.data, 'array')
          assert.equal(res.body.data.length, 1)

          assert.property(res.body.data[0], 'id')
          assert.property(res.body.data[0], 'externalId')
          assert.property(res.body.data[0], 'startedOn')
          assert.property(res.body.data[0], 'endedOn')
          assert.property(res.body.data[0], 'createdOn')
          assert.property(res.body.data[0], 'updatedOn')
          assert.property(res.body.data[0], 'longitude')
          assert.property(res.body.data[0], 'latitude')
          assert.property(res.body.data[0], 'assayExternalId')
          assert.property(res.body.data[0], 'siteName')
          assert.property(res.body.data[0], 'deviceName')
          assert.property(res.body.data[0], 'resultCategory1ExternalId')
          assert.property(res.body.data[0], 'resultCategory2ExternalId')
          assert.property(res.body.data[0], 'workflowStatus')
          assert.property(res.body.data[0], 'treatmentStatus')
          assert.property(res.body.data[0], 'patientData')
          assert.property(res.body.data[0], 'resultData')
          assert.equal(res.body.data[0].workflowStatus.externalId, 'Delivered')
          assert.property(res.body.data[0], 'formData')
          assert.property(res.body.data[0], 'researchId')
          assert.property(res.body.data[0], 'senderVersion')
          assert.property(res.body.data[0], 'senderOperator')
          assert.property(res.body.data[0], 'notes')
          assert.property(res.body.data[0], 'errorCode')
          assert.property(res.body.data[0], 'errorNotes')
          assert.property(res.body.data[0], 'sample')

          done()
        })
    })

    it('should return a paged list of results, including all result details, that the clinician has access to', () =>
      runTestWithKnex(knex => {
        server
          .get(`${path}?deviceType=DaktariVirology`)
          .set('Authorization', `Bearer ${clinicianAccessToken}`)
          .end(async (err, res) => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')

            assert.property(res.body, 'ok')
            assert.property(res.body, 'total')
            assert.property(res.body, 'length')
            assert.property(res.body, 'data')

            assert.equal(res.body.ok, true)
            assert.equal(res.body.length, 3)

            assert.typeOf(res.body.data, 'array')
            assert.equal(res.body.data.length, 3)

            assert.property(res.body.data[0], 'id')
            assert.property(res.body.data[0], 'externalId')
            assert.property(res.body.data[0], 'startedOn')
            assert.property(res.body.data[0], 'endedOn')
            assert.property(res.body.data[0], 'createdOn')
            assert.property(res.body.data[0], 'updatedOn')
            assert.property(res.body.data[0], 'longitude')
            assert.property(res.body.data[0], 'latitude')
            assert.property(res.body.data[0], 'assayExternalId')
            assert.property(res.body.data[0], 'siteName')
            assert.property(res.body.data[0], 'deviceName')
            assert.property(res.body.data[0], 'resultCategory1ExternalId')
            assert.property(res.body.data[0], 'resultCategory2ExternalId')
            assert.property(res.body.data[0], 'workflowStatus')
            assert.equal(
              res.body.data[0].workflowStatus.externalId,
              'Delivered'
            )
            assert.property(res.body.data[0], 'treatmentStatus')
            assert.property(res.body.data[0], 'patientData')
            assert.property(res.body.data[0], 'resultData')
            assert.property(res.body.data[0], 'formData')
            assert.property(res.body.data[0], 'researchId')
            assert.property(res.body.data[0], 'senderVersion')
            assert.property(res.body.data[0], 'senderOperator')
            assert.property(res.body.data[0], 'notes')
            assert.property(res.body.data[0], 'errorCode')
            assert.property(res.body.data[0], 'errorNotes')
            assert.property(res.body.data[0], 'sample')

            assert.property(res.body.data[0], 'followUps')
            assert.typeOf(res.body.data[0].followUps, 'array')
            assert.property(res.body.data[0].followUps[0], 'id')
            assert.property(res.body.data[0].followUps[0], 'externalId')
            assert.property(res.body.data[0].followUps[0], 'i18nKey')
            assert.property(
              res.body.data[0].followUps[0],
              'followUpTypeExternalId'
            )
            assert.property(
              res.body.data[0].followUps[0],
              'followUpTypei18nKey'
            )
            assert.property(res.body.data[0].followUps[0], 'followUpTypeName')
            assert.property(res.body.data[0].followUps[0], 'date')
            assert.property(res.body.data[0].followUps[0], 'createdOn')
            assert.property(res.body.data[0].followUps[0], 'updatedOn')

            assert.equal(Object.keys(res.body.data[0]).length, 26)
            // check if the download is register in the table.
            const { count: totalResult } = await knex('ResultDownloadLog')
              .where('resultId', res.body.data[0].id)
              .count('id as count')
              .first()

            assert.isAtLeast(totalResult, 1)
          })
      }))
  })
})

describe('Result Treatment', () => {
  describe('Status Tracking - POST', () => {
    const path = '/api/result/confirmed-treatment-tracking'
    shared.checkToken(server, path)

    it('Should return percentages of OnTreatment and Unaccountable', done => {
      const now = new Date()
      const endedOn = dateFormat(endOfMonth(subMonths(now, 1)), 'yyyy-MM-dd')
      const siteId = null
      server
        .post(`${path}`)
        .send({ endedOn, siteId })
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')

          assert.property(res.body, 'endedOn')
          assert.property(res.body, 'data')
          assert.property(res.body, 'siteId')

          assert.equal(res.body.data.length, 6) // for 6 months
          assert.property(res.body.data[0], 'monthTested')
          assert.property(res.body.data[0], 'pcConfirmed')
          assert.property(res.body.data[0], 'cntConfirmed')
          assert.property(res.body.data[0], 'total')

          done()
        })
    })
  })

  describe('Add Result Note - POST', () => {
    const resultId = 1

    after(async () =>
      runTestWithKnex(async knex => {
        await knex('ResultNote')
          .where('resultId', resultId)
          .delete()
      })
    )
    const path = '/api/result/result-note'

    it('Should return list of result note of a particular resultId', done => {
      const comment = {
        note: 'Cough confirmed',
        resultNoteType: 'ResultFollowUp',
      }
      server
        .post(`${path}/${resultId}`)
        .send(comment)
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')

          assert.property(res.body, 'data')

          assert.equal(res.body.data.length, 1) // for 6 months
          assert.property(res.body.data[0], 'createdBy')
          assert.property(res.body.data[0], 'text')
          assert.property(res.body.data[0], 'changedOn')
          assert.property(res.body.data[0], 'createdOn')

          done()
        })
    })
  })
})

describe('Result Follow Up', () => {
  describe('GET', () => {
    const path = '/api/result/follow-ups'

    shared.checkToken(server, path)

    it('should return a list of possible result follow ups', done => {
      server
        .get(path)
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.isAtLeast(res.body.data.length, 7)
          assert.property(res.body, 'total')
          done()
        })
    })
  })

  describe('POST', () => {
    const resultId = 1
    const path = `/api/result/follow-up/${resultId}`

    it('Should add a follow up to a result and update treatment status', async () =>
      runTestWithKnex(async knex => {
        const { id: followUpId } = await knex('FollowUp')
          .where('externalId', 'drtb-prexdr')
          .first('id')

        const date = new Date('2019-08-01')
        const resultFollowUpExternalId = '1234'

        const responseFirst = await server
          .post(`${path}`)
          .send({ followUpId, date, externalId: resultFollowUpExternalId })
          .set('Authorization', `Bearer ${shared.token}`)

        assert.equal(responseFirst.statusCode, 200)

        // should have follow up with the externalId 'drtb-prexdr'
        const {
          externalId: externalIdFollowUp,
          date: followUpDate,
        } = await knex('ResultFollowUp as rfu')
          .join('FollowUp as fu', 'rfu.followUpId', 'fu.id')
          .where('rfu.resultId', resultId)
          .where('rfu.externalId', resultFollowUpExternalId)
          .first('fu.externalId', 'rfu.date')

        assert.equal(externalIdFollowUp, 'drtb-prexdr')
        assert.equal(date.getTime(), followUpDate.getTime())

        const responseSecond = await server
          .post(`${path}`)
          .send({ followUpId, externalId: resultFollowUpExternalId })
          .set('Authorization', `Bearer ${shared.token}`)

        assert.equal(
          responseSecond.statusCode,
          400,
          'Should return error if external ID already exists'
        )

        // should have a treatment status of "On Treatment"
        const { externalId } = await knex('Result as r')
          .join(
            'ResultTreatmentStatusLog as rtsl',
            'r.treatmentStatusLogId',
            'rtsl.id'
          )
          .join(
            'ResultTreatmentStatus as rts',
            'rtsl.resultTreatmentStatusId',
            'rts.id'
          )
          .where('resultId', resultId)
          .first('rts.externalId')

        assert.equal(externalId, 'OnTreatment')
      }))
  })

  describe('PUT', () => {
    const resultId = 1
    const path = `/api/result/follow-up/${resultId}`

    it('Should update the date of a follow up', async () =>
      runTestWithKnex(async knex => {
        const date = new Date('2019-09-01')
        const response = await server
          .put(`${path}`)
          .send({ externalId: '1234', date })
          .set('Authorization', `Bearer ${shared.token}`)

        assert.equal(response.statusCode, 200)

        const { date: followUpDate } = await knex('ResultFollowUp as rfu')
          .where('resultId', resultId)
          .where('externalId', '1234')
          .first('rfu.date')

        assert.equal(date.getTime(), followUpDate.getTime())
      }))
  })

  describe('DELETE', () => {
    const resultId = 1
    const path = `/api/result/follow-up/${resultId}`

    it('Should delete the follow up with the given external ID', async () =>
      runTestWithKnex(async knex => {
        const response = await server
          .delete(`${path}`)
          .send({ externalId: '1234' })
          .set('Authorization', `Bearer ${shared.token}`)

        assert.equal(response.statusCode, 200)
        assert.typeOf(response.body, 'Object')
        assert.property(response.body, 'data')
        assert.typeOf(response.body.data, 'Object')
        assert.property(response.body.data, 'id')
        assert.property(response.body.data, 'externalId')
        assert.property(response.body.data, 'resultData')

        // should not have any follow ups
        const followUps = await knex('ResultFollowUp')
          .where('resultId', resultId)
          .where('externalId', '1234')
          .first('id')

        assert(!followUps)
      }))

    it('Should return result details even if follow up was not found', async () =>
      runTestWithKnex(async knex => {
        const response = await server
          .delete(`${path}`)
          .send({ externalId: 'VWXYZ' })
          .set('Authorization', `Bearer ${shared.token}`)

        assert.equal(response.statusCode, 200)
        assert.typeOf(response.body, 'Object')
        assert.property(response.body, 'data')
        assert.typeOf(response.body.data, 'Object')
        assert.property(response.body.data, 'id')
        assert.property(response.body.data, 'externalId')
        assert.property(response.body.data, 'resultData')

        // should not have any follow ups
        const followUps = await knex('ResultFollowUp')
          .where('resultId', resultId)
          .where('externalId', '1234')
          .first('id')

        assert(!followUps)
      }))
  })
})
