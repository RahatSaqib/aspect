const supertest = require('supertest')
const chai = require('chai')
const _ = require('lodash')
const {
  addMinutes,
  subDays,
  parseISO,
  format: dateFormat,
} = require('date-fns')
const Promise = require('bluebird')
const shared = require('../utils/sharedToken')
const { runTestWithKnex } = require('../utils/generatorFunctionUtils')
const {
  deviceStatusToId,
  sampleTypeToId,
  allResultCategoryToId,
  resultSourceToId,
  resultTypeToId,
} = require('../../src/shared/dictionary')
const { knex } = require('../../src/db')
const AssayCovidResultFormSchema = require('../../seeds/fixtures/AssayCovidResultFormSchema.json')
const { getAccessToken, createUser, removeUser } = require('../utils/authUtils')

const server = supertest.agent('http://localhost:8080')
const { assert, expect } = chai

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
            assert.isAtLeast(res.body.data.length, 3)
            assert.property(res.body.data[0], 'id')
            assert.property(res.body.data[0], 'externalId')
            assert.property(res.body.data[0], 'endedOn')
            assert.property(res.body.data[0], 'deviceName')
            assert.property(res.body.data[0], 'sampleOriginSiteName')
            assert.property(res.body.data[0], 'sampleId')
            assert.property(res.body.data[0], 'resultText')
            assert.property(res.body.data[0], 'errorCode')
            assert.property(res.body.data[0], 'resultWorkflowStatus')
            assert.property(res.body.data[0], 'resultTreatmentStatus')
            assert.property(res.body.data[0], 'treatmentStatusInfo')
            assert.property(res.body.data[0], 'patientId')
            assert.property(res.body.data[0], 'assayId')
            assert.property(res.body, 'total')
            ;[
              {
                id: resultId,
                resultWorkflowStatus: initialResultWorkflowStatus,
                assayId,
              },
            ] = res.body.data
            return res.body.data[0].resultWorkflowStatus
          })

        initialResultWorkflowStatus = (
          await knex
            .from('ResultWorkflowStatus')
            .where({ name: initialResultWorkflowStatusName })
            .first('externalId')
        ).externalId
      }))

    it('should return a list of results with assay-specific fields if TB assay is requested', async () => {
      await server
        .get(`${path}?assayId=${assayId}`)
        .set('Authorization', `Bearer ${shared.token}`)
        .then(res => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.isAtLeast(res.body.data.length, 5)
          assert.property(res.body.data[0], 'id')
          assert.property(res.body.data[0], 'externalId')
          assert.property(res.body.data[0], 'endedOn')
          assert.property(res.body.data[0], 'deviceName')
          assert.property(res.body.data[0], 'sampleOriginSiteName')
          assert.property(res.body.data[0], 'sampleId')
          assert.property(res.body.data[0], 'resultText')
          assert.property(res.body.data[0], 'errorCode')
          assert.property(res.body.data[0], 'resultWorkflowStatus')
          assert.property(res.body.data[0], 'resultTreatmentStatus')
          assert.property(res.body.data[0], 'treatmentStatusInfo')
          assert.property(res.body.data[0], 'patientId')
          assert.property(res.body, 'total')
          assert.typeOf(res.body.extraColumns, 'array')
        })
    })

    it('should return a single result', async () => {
      await server
        .get(`${path}/${resultId}`)
        .set('Authorization', `Bearer ${shared.token}`)
        .then(res => {
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
        })
    })

    it('should return a list of results that the clinician has access to via sample origin site', async () => {
      await server
        .get(`${path}?assayId=${assayId}`)
        .set('Authorization', `Bearer ${clinicianAccessToken}`)
        .then(res => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.isAtLeast(res.body.data.length, 3)
          assert.property(res.body.data[0], 'id')
          assert.property(res.body.data[0], 'externalId')
          assert.property(res.body.data[0], 'endedOn')
          assert.property(res.body.data[0], 'deviceName')
          assert.property(res.body.data[0], 'sampleOriginSiteName')
          assert.property(res.body.data[0], 'sampleId')
          assert.property(res.body.data[0], 'resultText')
          assert.property(res.body.data[0], 'errorCode')
          assert.property(res.body.data[0], 'resultWorkflowStatus')
          assert.property(res.body.data[0], 'resultTreatmentStatus')
          assert.property(res.body.data[0], 'treatmentStatusInfo')
          assert.property(res.body.data[0], 'patientId')
          assert.property(res.body, 'total')
          assert.typeOf(res.body.extraColumns, 'array')

          const originSites = _.uniqBy(res.body.data, 'sampleOriginSiteName')
          assert.equal(originSites.length, 1)
          assert.equal(originSites[0].sampleOriginSiteName, 'Dayton Ohio')
          ;[{ id: resultId }] = res.body.data
        })
    })

    it('should return a single result that the clinician has access to via sample origin site', async () => {
      await server
        .get(`${path}/${resultId}`)
        .set('Authorization', `Bearer ${clinicianAccessToken}`)
        .then(res => {
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
        })
    })

    const assayBdMgitGndAssayExternalId = 'assayBdMgitGnd'
    const bdmgitGndClinicianUsername = 'mgit_gnd_clinician'
    const bdmgitGndClinicianPassword = 'mgit-gnd-clinician-pass'
    let bdmgitGndClinicianUserId
    let bdmgitGndClinicianAuthAccessToken

    const assayDaktariHivVlExternalId = 'DaktariHivVL'
    const daktariHivVlClinicianUsername = 'dak_vl_clinician'
    const daktariHivVlClinicianPassword = 'vl-vl-clinician-pass'
    let daktariHivVlClinicianUserId
    let daktariHivVlClinicianAuthAccessToken
    before(async () => {
      bdmgitGndClinicianUserId = await createUser(
        'Partner One',
        'US',
        bdmgitGndClinicianUsername,
        bdmgitGndClinicianPassword,
        [
          {
            jobFunctionExternalId: 'clinician',
            assayExternalId: assayBdMgitGndAssayExternalId,
          },
        ]
      )
      bdmgitGndClinicianAuthAccessToken = await getAccessToken(
        bdmgitGndClinicianUsername,
        bdmgitGndClinicianPassword
      )

      daktariHivVlClinicianUserId = await createUser(
        'Partner One',
        'US',
        daktariHivVlClinicianUsername,
        daktariHivVlClinicianPassword,
        [
          {
            jobFunctionExternalId: 'clinician',
            assayExternalId: assayDaktariHivVlExternalId,
          },
        ]
      )
      daktariHivVlClinicianAuthAccessToken = await getAccessToken(
        daktariHivVlClinicianUsername,
        daktariHivVlClinicianPassword
      )
    })

    after(async () => {
      removeUser(bdmgitGndClinicianUserId)
      removeUser(daktariHivVlClinicianUserId)
    })

    it("should constrain results returned based on the user's job context", async () => {
      const mgitUserResultsResponse = await server
        .get(path)
        .set('Authorization', `Bearer ${bdmgitGndClinicianAuthAccessToken}`)
      assert.equal(mgitUserResultsResponse.status, 200)
      assert.typeOf(mgitUserResultsResponse.body, 'Object')
      assert.property(mgitUserResultsResponse.body, 'data')
      assert.typeOf(mgitUserResultsResponse.body.data, 'array')
      assert.equal(mgitUserResultsResponse.body.data.length, 0)
      assert.property(mgitUserResultsResponse.body, 'total')
      assert.typeOf(mgitUserResultsResponse.body.extraColumns, 'array')

      const daktariHivVlUserResultsResponse = await server
        .get(path)
        .set('Authorization', `Bearer ${daktariHivVlClinicianAuthAccessToken}`)
      assert.equal(daktariHivVlUserResultsResponse.status, 200)
      assert.typeOf(daktariHivVlUserResultsResponse.body, 'Object')
      assert.property(daktariHivVlUserResultsResponse.body, 'data')
      assert.typeOf(daktariHivVlUserResultsResponse.body.data, 'array')
      assert.isAtLeast(daktariHivVlUserResultsResponse.body.data.length, 5)
      const { name: daktariHivVlAssayName } = await knex('Assay')
        .where('externalId', assayDaktariHivVlExternalId)
        .first()
      daktariHivVlUserResultsResponse.body.data.forEach(result => {
        assert.equal(result.assayName, daktariHivVlAssayName)
      })
      assert.property(daktariHivVlUserResultsResponse.body, 'total')
      assert.typeOf(daktariHivVlUserResultsResponse.body.extraColumns, 'array')
    })
  })

  describe('PUT', () => {
    after(() =>
      runTestWithKnex(async knex => {
        await knex('ResultTreatmentStatusLog')
          .where('resultId', resultId)
          .delete()
      })
    )
    it('Should update result status given a resultId', async () => {
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
      await server
        .put(`${path}/workflow-status/${resultId}`)
        .send(updateWithExternalId)
        .set('Authorization', `Bearer${shared.token}`)
        .then(res => {
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
        })
      // update with resultWorkflowStatusId
      await server
        .put(`${path}/workflow-status/${resultId}`)
        .send(updateWithId)
        .set('Authorization', `Bearer${shared.token}`)
        .then(res => {
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
        })
      // Check if update persisted
      await server
        .get(`/api/result/${resultId}`)
        .set('Authorization', `Bearer${shared.token}`)
        .then(res => {
          assert.equal(res.body.data.resultWorkflowStatus, 'OK')
        })
      // Clean Up: Update resultWorkflowStatus with original status
      await server
        .put(`${path}/workflow-status/${resultId}`)
        .send({
          resultWorkflowStatusId: null,
          externalId: initialResultWorkflowStatus,
        })
        .set('Authorization', `Bearer${shared.token}`)
        .then(res => {
          assert.equal(
            res.body.data.resultWorkflowStatus,
            initialResultWorkflowStatusName
          )
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

    it('Should update result treatment status given a resultId - with externalId', async () =>
      runTestWithKnex(async knex => {
        const changedOn = new Date()
        const updateWithExternalId = {
          externalId: 'AwaitingTreatment',
          data: 'should be treated',
          method: 'sms',
          changedOn,
        }
        const { testResultId } = await knex('ResultTreatmentStatus as s')
          .join(
            'ResultTreatmentStatusLog as l',
            's.id',
            'l.resultTreatmentStatusId'
          )
          .where('s.externalId', '<>', 'AwaitingTreatment')
          .first('l.resultId as testResultId')

        // update with external ID
        return server
          .put(`${path}/treatment-status/${testResultId}`)
          .send(updateWithExternalId)
          .set('Authorization', `Bearer${shared.token}`)
          .then(res => {
            baseTreatmentStatusAssertion(res)

            const { treatmentStatus } = res.body.data
            // check the updated fieldName
            assert.equal(treatmentStatus.externalId, 'AwaitingTreatment')
          })
      }))

    it('Should update result treatment status given a resultId - with resultTreatmentStatusId', async () => {
      const changedOn = addMinutes(new Date(), 1)
      const updateWithId = {
        resultTreatmentStatusId: 2,
        data: 'should be treated',
        method: 'sms',
        changedOn,
      }
      // update with resultTreatmentStatusId
      await server
        .put(`${path}/treatment-status/${resultId}`)
        .send(updateWithId)
        .set('Authorization', `Bearer${shared.token}`)
        .then(res => {
          baseTreatmentStatusAssertion(res)

          const { treatmentStatus } = res.body.data

          // check if resultWorkflowStatus was updated
          assert.equal(treatmentStatus.externalId, 'OnTreatment')
        })
    })

    it('Should update result treatment status given a resultId - set resultNotes', async () => {
      const changedOn = addMinutes(new Date(), 2)
      const updateWithNull = {
        resultTreatmentStatusId: null,
        data: 'should be treated',
        method: 'sms',
        changedOn,
      }
      // set to null
      await server
        .put(`${path}/treatment-status/${resultId}`)
        .send(updateWithNull)
        .set('Authorization', `Bearer${shared.token}`)
        .then(res => {
          baseTreatmentStatusAssertion(res)

          assert.equal(res.body.data.resultTreatmentData, 'should be treated')
        })
    })

    describe('Form data', () => {
      describe('Basic functionality', () => {
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

        it('Should save values to the formData field in the result', () =>
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

        it("Should NOT save values to the formData field in the result when field sent is not in the assay's form schema", () =>
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

        it("Should NOT save values to the formData field in the result when value is not in the selector field's options list", () =>
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

      describe('COVID-19 Result Updates', () => {
        shared.checkToken(server, path)
        const covidDeviceTypeDevices = {
          CepheidGeneXpert: null,
          Aspect: null,
          rocheMagnaPure96: null,
          appliedBiosystemsQuantStudio7Flex: null,
        }
        const covidDeviceTypeAssays = {
          CepheidGeneXpert: null,
          Aspect: null,
          rocheMagnaPure96: null,
          appliedBiosystemsQuantStudio7Flex: null,
        }
        let partnerId
        let adminId
        let otherUserId
        let sampleTypeNasalSwabId
        let resultCategories
        let resultSourceEnteredByHandId
        let resultSourceDiagnosticDeviceId
        let resultTypePatientId
        const sampleIdsInserted = []
        const resultIdsInserted = []

        before(async () => {
          partnerId = (
            await knex('Partner')
              .where('name', 'Partner One')
              .first('id')
          ).id
          adminId = (
            await knex('User')
              .where('name', 'admin')
              .first('id')
          ).id
          otherUserId = (
            await knex('User')
              .where('name', '<>', 'admin')
              .first('id')
          ).id
          const deviceStatusApprovedId = await deviceStatusToId('approved')
          await Promise.each(
            Object.keys(covidDeviceTypeDevices),
            async deviceTypeExternalId => {
              covidDeviceTypeDevices[deviceTypeExternalId] = await knex(
                'DeviceType as dt'
              )
                .join('Device as d', 'dt.id', 'd.deviceTypeId')
                .join('Site as s', 'd.siteId', 's.id')
                .join('Geography as g', 's.geographyId', 'g.id')
                .join('Country as c', 'g.countryId', 'c.id')
                .where('dt.externalId', deviceTypeExternalId)
                .andWhere('c.abbreviation', 'US')
                .andWhere('d.deviceStatusId', deviceStatusApprovedId)
                .first('d.*')
              covidDeviceTypeAssays[deviceTypeExternalId] = await knex(
                'DeviceType as dt'
              )
                .join('Assay as a', 'dt.id', 'a.deviceTypeId')
                .join('AssayType as at', 'a.assayTypeId', 'at.id')
                .where('dt.externalId', deviceTypeExternalId)
                .where('at.externalId', 'covid19')
                .first('a.*')
            }
          )

          sampleTypeNasalSwabId = await sampleTypeToId('NasalSwab')
          resultCategories = await allResultCategoryToId()
          resultSourceEnteredByHandId = await resultSourceToId('EnteredByHand')
          resultSourceDiagnosticDeviceId = await resultSourceToId(
            'DiagnosticDevice'
          )
          resultTypePatientId = await resultTypeToId('Patient')
        })

        after(async () => {
          if (!_.isEmpty(resultIdsInserted)) {
            await knex('Result')
              .whereIn('id', resultIdsInserted)
              .del()
          }
          if (!_.isEmpty(sampleIdsInserted)) {
            await knex('Sample')
              .whereIn('id', sampleIdsInserted)
              .del()
          }
          return Promise.resolve()
        })

        function calculateDateForResult() {
          const daysToSubtract = Math.ceil(Math.random() ** 4 * 60)
          return subDays(new Date(), daysToSubtract)
        }

        async function createCovid19Result(
          deviceTypeExternalId,
          resultDetails = {},
          sampleDetails = {},
          createDeviceLogFromInstrument = false
        ) {
          const device = covidDeviceTypeDevices[deviceTypeExternalId]
          const site = await knex('Site')
            .where('id', device.siteId)
            .first()
          const randomDate = calculateDateForResult()
          const randomNumber = calculateDateForResult().getTime()

          const sample = {
            externalId: `SMP-CV-${randomNumber}`,
            collectedOn: calculateDateForResult(),
            sampleTypeId: sampleTypeNasalSwabId,
            originSiteId: site.id,
            ...sampleDetails,
          }
          sample.id = await knex('Sample').insert(sample)
          sampleIdsInserted.push(sample.id)
          const [resultId] = await knex('Result').insert({
            externalId: `COVID-${randomNumber}`,
            assayId: covidDeviceTypeAssays[deviceTypeExternalId].id,
            partnerId,
            geographyId: site.geographyId,
            siteId: site.id,
            reportableSiteId: site.id,
            deviceId: device.id,
            longitude: site.longitude,
            latitude: site.latitude,
            resultSourceId:
              deviceTypeExternalId === 'Aspect'
                ? resultSourceEnteredByHandId
                : resultSourceDiagnosticDeviceId,
            resultTypeId: resultTypePatientId,
            sampleId: sample.id,
            resultCategory1: resultCategories.Unknown,
            resultCategory2: resultCategories.Unknown,
            resultData: '{}',
            formData: '{}',
            patientData: '{}',
            startedOn: deviceTypeExternalId === 'Aspect' ? null : randomDate,
            endedOn: addMinutes(randomDate, 100),
            createdOn: addMinutes(randomDate, 120),
            updatedOn: addMinutes(randomDate, 180),
            createdBy: otherUserId,
            updatedBy: otherUserId,
            ...resultDetails,
          })
          if (createDeviceLogFromInstrument) {
            await knex('DeviceLog').insert({
              createdOn: randomDate,
              deviceConfigurationUpdated: 0,
              deviceId: device.id,
              rawMessage: `Some raw message from ${device.name}`,
              resultId,
              senderIp: '127.0.0.1',
              source: device.name,
            })
          }
          resultIdsInserted.push(resultId)
          return resultId
        }

        async function getResult(resultId) {
          return knex('Result')
            .where('id', resultId)
            .first()
        }

        function getOptionValueFromTitle(options, title) {
          // eslint-disable-next-line eqeqeq
          return (options.find(option => option.title == title) || {}).value
        }

        it('Should update result details when relevant form fields are saved', async () => {
          const dateAndTimeOfTest = new Date(2020, 1, 2)
          const testReasonText = 'Detected at point of entry'
          const testReason = getOptionValueFromTitle(
            AssayCovidResultFormSchema.fields.testReason.control.options,
            testReasonText
          )
          const age = 4
          const genderText = 'Female'
          const gender = getOptionValueFromTitle(
            AssayCovidResultFormSchema.fields.gender.control.options,
            genderText
          )
          const resultText = 'Positive'
          const testResult = getOptionValueFromTitle(
            AssayCovidResultFormSchema.fields.testResult.control.options,
            resultText
          )
          await Promise.each(
            Object.keys(covidDeviceTypeDevices),
            async deviceTypeId => {
              const caseId = `${deviceTypeId} TEST-CASE-ID`
              let testTypeText
              let testType
              const resultId = await createCovid19Result(deviceTypeId)
              const formDataToSend = {
                caseId,
                testReason,
                age,
                gender,
                testResult,
                dateAndTimeOfTest,
              }
              if (deviceTypeId === 'Aspect') {
                testTypeText = 'Digital X-Ray'
                testType = getOptionValueFromTitle(
                  [
                    {
                      title: 'PCR/molecular',
                      value: 'pcr',
                    },
                    {
                      title: 'Immunoassay',
                      value: 'immunoassay',
                    },
                    {
                      title: 'Rapid diagnostic test',
                      value: 'rapidDiagnosticTest',
                    },
                    {
                      title: 'Digital X-Ray',
                      value: 'digitalXRay',
                    },
                  ],
                  testTypeText
                )
                formDataToSend.testType = testType
              }
              const response = await server
                .put(`${path}/form-data/${resultId}`)
                .send(formDataToSend)
                .set('Authorization', shared.token)
              expect(response.body.data.id).to.equal(resultId)
              const result = await getResult(resultId)
              result.patientData = JSON.parse(result.patientData)
              result.resultData = JSON.parse(result.resultData)
              result.formData = JSON.parse(result.formData)
              expect(result).to.containSubset({
                patientData: {
                  id: caseId,
                  caseId,
                  age,
                  gender: genderText,
                  testReason: testReasonText,
                },
                resultData: { resultText, typeOfTest: testTypeText },
                formData: {
                  ...formDataToSend,
                  dateAndTimeOfTest: formDataToSend.dateAndTimeOfTest.toISOString(),
                },
                startedOn: dateAndTimeOfTest,
                endedOn: dateAndTimeOfTest,
                resultCategory1: resultCategories[resultText],
                updatedBy: adminId,
              })
            }
          )
        })

        it('Should create a device log from Aspect when saving each result', async () => {
          const dateAndTimeOfTest = new Date(2020, 3, 22)
          const testReasonText = 'Unknown'
          const testReason = getOptionValueFromTitle(
            AssayCovidResultFormSchema.fields.testReason.control.options,
            testReasonText
          )
          const age = 27
          const genderText = 'Male'
          const gender = getOptionValueFromTitle(
            AssayCovidResultFormSchema.fields.gender.control.options,
            genderText
          )
          const resultText = 'Negative'
          const testResult = getOptionValueFromTitle(
            AssayCovidResultFormSchema.fields.testResult.control.options,
            resultText
          )
          await Promise.each(
            Object.keys(covidDeviceTypeDevices),
            async deviceTypeId => {
              const caseId = `${deviceTypeId} TEST-CASE-ID`
              let testTypeText
              let testType
              const resultId = await createCovid19Result(deviceTypeId)
              const formDataToSend = {
                caseId,
                testReason,
                age,
                gender,
                testResult,
                dateAndTimeOfTest,
              }
              if (deviceTypeId === 'Aspect') {
                testTypeText = 'Digital X-Ray'
                testType = getOptionValueFromTitle(
                  [
                    {
                      title: 'PCR/molecular',
                      value: 'pcr',
                    },
                    {
                      title: 'Immunoassay',
                      value: 'immunoassay',
                    },
                    {
                      title: 'Rapid diagnostic test',
                      value: 'rapidDiagnosticTest',
                    },
                    {
                      title: 'Digital X-Ray',
                      value: 'digitalXRay',
                    },
                  ],
                  testTypeText
                )
                formDataToSend.testType = testType
              }
              const response = await server
                .put(`${path}/form-data/${resultId}`)
                .send(formDataToSend)
                .set('Authorization', shared.token)
              expect(response.body.data.id).to.equal(resultId)
              const result = await getResult(resultId)
              result.patientData = JSON.parse(result.patientData)
              result.resultData = JSON.parse(result.resultData)
              result.formData = JSON.parse(result.formData)
              expect(result).to.containSubset({
                patientData: {
                  id: caseId,
                  caseId,
                  age,
                  gender: genderText,
                  testReason: testReasonText,
                },
                resultData: { resultText, typeOfTest: testTypeText },
                formData: {
                  ...formDataToSend,
                  dateAndTimeOfTest: formDataToSend.dateAndTimeOfTest.toISOString(),
                },
                startedOn: dateAndTimeOfTest,
                endedOn: dateAndTimeOfTest,
                resultCategory1: resultCategories[resultText],
                updatedBy: adminId,
              })
              const deviceLogsForResult = await knex('DeviceLog')
                .where({ resultId })
                .select()
              expect(deviceLogsForResult).to.have.lengthOf(1)
              expect(deviceLogsForResult).to.containSubset([
                {
                  deviceId: covidDeviceTypeDevices.Aspect.id,
                  source: 'Result Edited in Aspect',
                  rawMessage: JSON.stringify({
                    auth: { credentials: { name: 'admin' } },
                    params: { resultId },
                    payload: formDataToSend,
                  }),
                },
              ])
            }
          )
        })

        it('Should NOT overwrite diagnostic data if the result has already come from an instrument', async () => {
          const dateAndTimeOfTest = new Date(2020, 3, 14)
          const testReasonText =
            'Ill Seeking Healthcare due to suspicion of COVID-19'
          const testReason = getOptionValueFromTitle(
            AssayCovidResultFormSchema.fields.testReason.control.options,
            testReasonText
          )
          const age = 78
          const genderText = 'Male'
          const gender = getOptionValueFromTitle(
            AssayCovidResultFormSchema.fields.gender.control.options,
            genderText
          )
          const resultText = 'Negative'
          const testResult = getOptionValueFromTitle(
            AssayCovidResultFormSchema.fields.testResult.control.options,
            resultText
          )
          await Promise.each(
            Object.keys(covidDeviceTypeDevices),
            async deviceTypeId => {
              const patientDataFromInstrument = {
                id: `PATIENT-ID-FROM-${deviceTypeId}`,
                caseId: 'CASE-ID-FROM-INSTRUMENT',
              }
              const resultDataFromInstrument = {
                resultText: `Positive`,
              }
              const resultFromInstrument = {
                patientData: JSON.stringify(patientDataFromInstrument),
                resultData: JSON.stringify(resultDataFromInstrument),
                resultCategory1: resultCategories.Positive,
                startedOn: addMinutes(dateAndTimeOfTest, 123),
                endedOn: addMinutes(dateAndTimeOfTest, 223),
              }
              const caseId = `${deviceTypeId} TEST-CASE-ID`
              let testTypeText
              let testType
              const resultId = await createCovid19Result(
                deviceTypeId,
                resultFromInstrument,
                {},
                true
              )
              const formDataToSend = {
                caseId,
                testReason,
                age,
                gender,
                testResult,
                dateAndTimeOfTest,
              }
              if (deviceTypeId === 'Aspect') {
                testTypeText = 'Digital X-Ray'
                testType = getOptionValueFromTitle(
                  [
                    {
                      title: 'PCR/molecular',
                      value: 'pcr',
                    },
                    {
                      title: 'Immunoassay',
                      value: 'immunoassay',
                    },
                    {
                      title: 'Rapid diagnostic test',
                      value: 'rapidDiagnosticTest',
                    },
                    {
                      title: 'Digital X-Ray',
                      value: 'digitalXRay',
                    },
                  ],
                  testTypeText
                )
                formDataToSend.testType = testType
              }
              const response = await server
                .put(`${path}/form-data/${resultId}`)
                .send(formDataToSend)
                .set('Authorization', shared.token)
              expect(response.body.data.id).to.equal(resultId)
              const result = await getResult(resultId)
              result.patientData = JSON.parse(result.patientData)
              result.resultData = JSON.parse(result.resultData)
              result.formData = JSON.parse(result.formData)
              if (deviceTypeId !== 'Aspect') {
                expect(result).to.containSubset({
                  patientData: {
                    id: patientDataFromInstrument.id,
                    caseId,
                    age,
                    gender: genderText,
                    testReason: testReasonText,
                  },
                  resultData: {
                    resultText: resultDataFromInstrument.resultText,
                    typeOfTest: testTypeText,
                  },
                  formData: {
                    ...formDataToSend,
                    dateAndTimeOfTest: formDataToSend.dateAndTimeOfTest.toISOString(),
                  },
                  startedOn: resultFromInstrument.startedOn,
                  endedOn: resultFromInstrument.endedOn,
                  resultCategory1: resultFromInstrument.resultCategory1,
                  updatedBy: adminId,
                })
              } else {
                expect(result).to.containSubset({
                  patientData: {
                    id: caseId,
                    caseId,
                    age,
                    gender: genderText,
                    testReason: testReasonText,
                  },
                  resultData: { resultText, typeOfTest: testTypeText },
                  formData: {
                    ...formDataToSend,
                    dateAndTimeOfTest: formDataToSend.dateAndTimeOfTest.toISOString(),
                  },
                  startedOn: dateAndTimeOfTest,
                  endedOn: dateAndTimeOfTest,
                  resultCategory1: resultCategories[resultText],
                  updatedBy: adminId,
                })
              }
              const deviceLogsForResult = await knex('DeviceLog')
                .where({ resultId })
                .select()
              expect(deviceLogsForResult).to.have.lengthOf(2)
              expect(deviceLogsForResult).to.containSubset([
                {
                  deviceId: covidDeviceTypeDevices.Aspect.id,
                  source: 'Result Edited in Aspect',
                  rawMessage: JSON.stringify({
                    auth: { credentials: { name: 'admin' } },
                    params: { resultId },
                    payload: formDataToSend,
                  }),
                },
              ])
            }
          )
        })
      })
    })
  })
})
