const chai = require('chai')
const chaiSubset = require('chai-subset')
const _ = require('lodash')
const { addMinutes, subDays, parseISO, format: dateFormat } = require('date-fns')
const Promise = require('bluebird')
const { createResult, getResult } = require('./result_utils')
const { createGxConnectTestContext } = require('../deviceApi/geneXpert/gxconnect_utils')
const shared = require('../utils/sharedToken')
const {
  deviceApprovalToId,
  allResultCategoryToId,
  resultCategoryToId,
  resultStatusToId,
  diseaseToId,
} = require('../../src/shared/dictionary')
const { knex } = require('../../src/db')
const AssayCovidResultFormSchema = require('../../seeds/fixtures/AssayCovidResultFormSchema.json')
const { getCommCarePayload } = require('../deviceApi/commcare/commcare_utils')
const { createTestContext, getDeviceFromApiKey, getLastResultId, getLastResult } = require('../deviceApi/utils')
const { getAdminId } = require('../utils/authUtils')
const server = require('../utils/testUtils')
const { addResultDownloadLog } = require('../../src/result/service')

const { assert, expect } = chai.use(chaiSubset)

const getClinicianAccessToken = async () => {
  const res = await server.post('/api/auth').send({
    name: 'clinician',
    password: 'test07',
    clientName: 'Mocha web',
  })
  return res.body.access
}
describe('Result routes', () => {
  const path = '/api/result'
  let resultId = 1
  let assayId = 1
  let clinicianAssayId = 1
  let clinicianResultId = 1
  let initialResultWorkflowStatus = ''
  let initialResultWorkflowStatusName = ''
  const reason = 'testing'
  const operator = 'Tester'
  const changedOn = new Date(dateFormat(new Date(), "yyyy-MM-dd HH:mm:ss.000'Z'"))

  let clinicianAccessToken = ''
  before(async () => {
    shared.checkToken(server, path)
    clinicianAccessToken = await getClinicianAccessToken()
    const {
      body: { data: clinicianAccessibleResults },
    } = await server.get(path).set('Authorization', `Bearer ${clinicianAccessToken}`)
    clinicianAssayId = clinicianAccessibleResults[0].assayId
    clinicianResultId = clinicianAccessibleResults[0].id
  })

  describe('GET', () => {
    const validateResponse = res => {
      assert.equal(res.status, 200)
      assert.typeOf(res.body, 'Object')
      assert.property(res.body, 'data')
      assert.typeOf(res.body.data, 'array')
      assert.isAtLeast(res.body.data.length, 1)
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
      assert.property(res.body.data[0], 'diseaseId')
      assert.property(res.body.data[0], 'diseaseName')
      assert.property(res.body.data[0], 'diseaseExternalId')
      assert.property(res.body.data[0], 'caseExternalId')
      assert.property(res.body, 'total')
      assert.typeOf(res.body.extraColumns, 'array')
    }

    describe('results with filters for treatments', () => {
      let siteId
      let deviceId
      let partnerId
      let resultsDownloadedByReporterIds
      let deviceContext

      beforeEach(async () => {
        deviceContext = createGxConnectTestContext(server, {
          countryCode: 'US',
          adminUsername: 'admin',
          adminPassword: 'test07',
          deviceName: `An Epic Device`,
          macAddress: `Oh wow, look at that MAC ADDRESS!`,
          hostId: `What is a host id?`,
          deviceSerialNumber: `I don't have more ideas`,
        })
        await deviceContext.beforeRegisterAndSetDevice()
        const { device } = deviceContext
        deviceId = device.id
        siteId = device.siteId
        partnerId = device.partnerId

        await knex('Device').where({ id: deviceId }).update({ defaultReportableSiteId: siteId })

        const resultCategoryDetected = await resultCategoryToId('Detected')
        const resultCategoryError = await resultCategoryToId('Error')
        /**
         * INSERT 25 RESULTS
         */
        await Promise.each(_.range(0, 25), async i => {
          const resultDetails = {
            consumableLot: 'Lot 0',
            moduleName: 'Module A',
            moduleSerial: 'M-123456-0',
            instrumentSerial: 'S-1234-0',
            endedOn: subDays(new Date(), i),
            errorCode: null,
            errorNotes: null,
            /**
             * 20 results will be reportable and will require treatment (DETECTED)
             * 5 resutls will not be reportable and will not require treatment (ERROR)
             */
            resultCategory1: i > 4 ? resultCategoryDetected : resultCategoryError,
          }
          await deviceContext.createResultForThisDevice({
            resultDetails,
          })
        })

        const { id: userId } = await knex('User').where({ name: 'admin' }).first()

        /**
         * DOWNLOAD 15 RESULTS IN THE REPORTER APP
         */
        resultsDownloadedByReporterIds = await knex('Result')
          .where({ deviceId })
          .orderBy('id', 'desc')
          .pluck('id')
          .limit(15)
        await addResultDownloadLog(resultsDownloadedByReporterIds, userId)
      })

      afterEach(async () => deviceContext.cleanUp())

      it('should get all the reportable results for a reportable site', async () => {
        const res = await server
          .get(path)
          .query({
            onlyReportableResults: true,
            reportableSiteId: siteId,
          })
          .set('Authorization', `Bearer ${shared.token}`)
        assert.equal(res.body.data.length, 20)
      })

      it('should get all the reportable results for a reportable site that were downloaded at the reporter app', async () => {
        const res = await server
          .get(path)
          .query({
            onlyReportableResults: true,
            reportableSiteId: siteId,
            onlyDownloadedByReporter: true,
          })
          .set('Authorization', `Bearer ${shared.token}`)

        assert.equal(res.body.data.length, 15)
      })

      it('should get all the results requiring treatment for a reportable site', async () => {
        const res = await server
          .get(path)
          .query({
            onlyTreatmentRequired: true,
            reportableSiteId: siteId,
          })
          .set('Authorization', `Bearer ${shared.token}`)

        assert.equal(res.body.data.length, 20)
      })

      it('should get only the results that were transferred from a reportable site', async () => {
        const [resultIdToTransfer] = resultsDownloadedByReporterIds
        const { id: anotherSiteId } = await knex('Site').where({ partnerId }).first()
        /**
         * Transfer one result to another site
         * - Update reportableSiteId in Result table
         * - Add a new entry in the ResultStatusLog
         */
        await knex('Result').where({ id: resultIdToTransfer }).update({ reportableSiteId: anotherSiteId })
        const transferStatusId = await resultStatusToId('Transfer')

        await knex('ResultStatusLog').insert({
          resultStatusId: transferStatusId,
          resultId: resultIdToTransfer,
          createdOn: new Date(),
          createdBy: 1,
          data: JSON.stringify({
            siteId,
            reportableSiteId: anotherSiteId,
            previousReportableSiteId: siteId,
            sampleOriginSiteId: siteId,
          }),
        })

        const res = await server
          .get(path)
          .query({
            onlyEverTransferred: true,
            reportableSiteId: siteId,
          })
          .set('Authorization', `Bearer ${shared.token}`)

        assert.equal(res.body.data.length, 1)
      })
    })

    it('should return a list of results', async () => {
      const res = await server.get(path).set('Authorization', `Bearer ${shared.token}`)

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
      assert.property(res.body.data[0], 'caseExternalId')
      assert.property(res.body, 'total')
      ;[{ id: resultId, resultWorkflowStatus: initialResultWorkflowStatus, assayId }] = res.body.data
      initialResultWorkflowStatusName = res.body.data[0].resultWorkflowStatus

      initialResultWorkflowStatus = (
        await knex.from('ResultWorkflowStatus').where({ name: initialResultWorkflowStatusName }).first('externalId')
      ).externalId
    })

    it('should return a list of results with assay-specific fields if TB assay is requested', async () => {
      const res = await server.get(`${path}?assayId=${assayId}`).set('Authorization', `Bearer ${shared.token}`)

      validateResponse(res)
    })

    it('should return a list of results filtered by disease', async () => {
      const { diseaseId } = await knex('Disease').where({ externalId: 'hiv' }).first('id as diseaseId')
      const res = await server.get(`${path}?diseaseId=${diseaseId}`).set('Authorization', `Bearer ${shared.token}`)

      validateResponse(res)
      _.each(res.body.data, elem => assert.equal(elem.diseaseId, diseaseId))
    })

    it('should return a list of results with case-specific', async () => {
      const { caseId } = await knex('Result')
        .join('PatientCase', 'patientCaseId', 'PatientCase.Id')
        .first('PatientCase.externalId as caseId')
      const res = await server.get(`${path}?caseId=${caseId}`).set('Authorization', `Bearer ${shared.token}`)
      validateResponse(res)
    })

    it('should return a single result', async () => {
      const res = await server.get(`${path}/${resultId}`).set('Authorization', `Bearer ${shared.token}`)

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
      assert.property(res.body.data, 'caseExternalId')
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

    it.skip('should return a list of results that the clinician has access to via sample origin site', async () => {
      const res = await server
        .get(`${path}?assayId=${clinicianAssayId}`)
        .set('Authorization', `Bearer ${clinicianAccessToken}`)
      validateResponse(res)

      const originSites = _.uniqBy(res.body.data, 'sampleOriginSiteName')
      assert.equal(originSites.length, 1)
      assert.equal(originSites[0].sampleOriginSiteName, 'Dayton Ohio')
      ;[{ id: resultId }] = res.body.data
    })

    it('should return a single result that the clinician has access to via sample origin site', async () => {
      const res = await server
        .get(`${path}/${clinicianResultId}`)
        .set('Authorization', `Bearer ${clinicianAccessToken}`)

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
      assert.property(res.body.data, 'caseExternalId')
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

  describe('PUT', () => {
    after(async () => {
      await knex('ResultTreatmentStatusLog').where('resultId', resultId).delete()
    })

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
      let res = await server
        .put(`${path}/workflow-status/${resultId}`)
        .send(updateWithExternalId)
        .set('Authorization', `Bearer${shared.token}`)

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
      assert.closeTo(new Date(res.body.data.updatedOn).getTime(), new Date().getTime(), 5000)
      assert.equal(
        dateFormat(parseISO(res.body.data.resultWorkflowLogChangedOn), 'yyyy-MM-dd HH:mm:ss'),
        dateFormat(changedOn, 'yyyy-MM-dd HH:mm:ss')
      )

      // update with resultWorkflowStatusId
      res = await server
        .put(`${path}/workflow-status/${resultId}`)
        .send(updateWithId)
        .set('Authorization', `Bearer${shared.token}`)

      assert.equal(res.status, 200)
      assert.typeOf(res.body, 'Object')
      assert.property(res.body, 'data')
      assert.typeOf(res.body.data, 'Object')
      assert.typeOf(res.body.data.assay, 'Object')
      assert.typeOf(res.body.data.assay.resultDataSchema, 'Object')
      assert.typeOf(res.body.data.resultData, 'Object')

      _.each(
        [
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
        ],
        fieldName => {
          assert.property(res.body.data, fieldName)
        }
      )

      // check if resultWorkflowStatus was updated
      assert.equal(res.body.data.resultWorkflowStatus, 'OK')

      // Check if update persisted
      res = await server.get(`/api/result/${resultId}`).set('Authorization', `Bearer${shared.token}`)

      assert.equal(res.body.data.resultWorkflowStatus, 'OK')

      // Clean Up: Update resultWorkflowStatus with original status
      res = await server
        .put(`${path}/workflow-status/${resultId}`)
        .send({
          resultWorkflowStatusId: null,
          externalId: initialResultWorkflowStatus,
        })
        .set('Authorization', `Bearer${shared.token}`)

      assert.equal(res.body.data.resultWorkflowStatus, initialResultWorkflowStatusName)
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

    it.skip('Should update result treatment status given a resultId - with externalId', async () => {
      const changedOn = new Date()
      const updateWithExternalId = {
        externalId: 'AwaitingTreatment',
        data: 'should be treated',
        method: 'sms',
        changedOn,
      }
      const { testResultId } = await knex('ResultTreatmentStatus as s')
        .join('ResultTreatmentStatusLog as l', 's.id', 'l.resultTreatmentStatusId')
        .where('s.externalId', '<>', 'AwaitingTreatment')
        .first('l.resultId as testResultId')

      // update with external ID
      const res = await server
        .put(`${path}/treatment-status/${testResultId}`)
        .send(updateWithExternalId)
        .set('Authorization', `Bearer${shared.token}`)

      baseTreatmentStatusAssertion(res)

      const { treatmentStatus } = res.body.data
      // check the updated fieldName
      assert.equal(treatmentStatus.externalId, 'AwaitingTreatment')
    })

    it('Should update result treatment status given a resultId - with resultTreatmentStatusId', async () => {
      const changedOn = addMinutes(new Date(), 1)
      const updateWithId = {
        resultTreatmentStatusId: 2,
        data: 'should be treated',
        method: 'sms',
        changedOn,
      }
      // update with resultTreatmentStatusId
      const res = await server
        .put(`${path}/treatment-status/${resultId}`)
        .send(updateWithId)
        .set('Authorization', `Bearer${shared.token}`)

      baseTreatmentStatusAssertion(res)

      const { treatmentStatus } = res.body.data

      // check if resultWorkflowStatus was updated
      assert.equal(treatmentStatus.externalId, 'OnTreatment')
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
        const context = createTestContext(knex, server, {
          user: 'gates_rdt',
          password: 'gates2018',
          type: 'CommCareApp',
          partner: 'GatesRDT',
          site: 'commcare',
        })
        let resultId
        let result
        let apiKey

        beforeEach(async () => {
          const commcarePluginPath = '/device/plugin/commcare'
          await context.createSites(['commcare'])
          await context.createDeviceApiKey()

          apiKey = context.apiKey // eslint-disable-line prefer-destructuring
          const res = await server
            .post(commcarePluginPath)
            .auth('commcare_test', apiKey.token)
            .send(
              getCommCarePayload({
                resultText: 'negative',
                age: 28,
                gender: 'male',
              })
            )
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')

          const device = await getDeviceFromApiKey(knex, apiKey)
          resultId = await getLastResultId(knex, device.id)
          result = await getLastResult(knex, device.id)
          assert.isNull(result.formData)
        })

        afterEach(context.afterEach)

        it('Should save values to the formData field in the result', async () => {
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
          let resultFromDatabase = await knex('Result').where('id', resultId).first('formData')
          assert.deepEqual(response.body.data.formData, JSON.parse(resultFromDatabase.formData))

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
          resultFromDatabase = await knex('Result').where('id', resultId).first('formData')
          assert.deepEqual(response.body.data.formData, JSON.parse(resultFromDatabase.formData))

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
          resultFromDatabase = await knex('Result').where('id', resultId).first('formData')
          assert.deepEqual(response.body.data.formData, JSON.parse(resultFromDatabase.formData))

          response = await server.put(`${path}/form-data/${resultId}`).send({}).set('Authorization', context.clientAuth)
          assert.deepEqual(response.body.data.formData, {
            expertInterpretation: 'negative',
          })
          assert.equal(response.body.data.id, resultId)
          resultFromDatabase = await knex('Result').where('id', resultId).first('formData')
          assert.deepEqual(response.body.data.formData, JSON.parse(resultFromDatabase.formData))
        })

        it("Should NOT save values to the formData field in the result when field sent is not in the assay's form schema", async () => {
          const response = await server
            .put(`${path}/form-data/${resultId}`)
            .send({
              someUndefinedField: 'positive',
              anotherUndefinedField: 'another value',
            })
            .set('Authorization', context.clientAuth)
          assert.equal(response.statusCode, 400)
          const resultFromDatabase = await knex('Result').where('id', resultId).first('formData')
          assert.isNull(resultFromDatabase.formData)
        })

        it("Should NOT save values to the formData field in the result when value is not in the selector field's options list", async () => {
          const response = await server
            .put(`${path}/form-data/${resultId}`)
            .send({
              expertInterpretation: 'unknown option',
            })
            .set('Authorization', context.clientAuth)
          assert.equal(response.statusCode, 400)
          const resultFromDatabase = await knex('Result').where('id', resultId).first('formData')
          assert.isNull(resultFromDatabase.formData)
        })
      })

      describe.skip('COVID-19 Result Updates', () => {
        const covidDeviceTypeDevices = {
          CepheidGeneXpert: null,
          Aspect: null,
          rocheMagnaPure96: null,
          appliedBiosystemsQuantStudio7Flex: null,
        }
        let partnerId
        let adminId
        let otherUserId
        let resultCategories
        let diseaseId
        let latestSampleIdBeforeTests
        let latestResultIdBeforeTests
        let latestCaseIdBeforeTests
        const getCaseIdByDeviceTypeId = deviceTypeId => `${deviceTypeId} TEST-CASE-ID`

        before(async () => {
          shared.checkToken(server, path)
          partnerId = (await knex('Partner').where('name', 'Partner One').first('id')).id
          adminId = await getAdminId()
          otherUserId = (await knex('User').where('name', '<>', 'admin').first('id')).id
          diseaseId = await diseaseToId('covid19')
          const deviceApprovalApprovedId = await deviceApprovalToId('approved')
          await Promise.each(Object.keys(covidDeviceTypeDevices), async deviceTypeExternalId => {
            covidDeviceTypeDevices[deviceTypeExternalId] = await knex('DeviceType as dt')
              .join('Device as d', 'dt.id', 'd.deviceTypeId')
              .join('Site as s', 'd.siteId', 's.id')
              .join('Geography as g', 's.geographyId', 'g.id')
              .join('Country as c', 'g.countryId', 'c.id')
              .where('dt.externalId', deviceTypeExternalId)
              .andWhere('c.abbreviation', 'US')
              .andWhere('d.deviceApprovalId', deviceApprovalApprovedId)
              .first('d.*')
          })

          resultCategories = await allResultCategoryToId()
          ;({ id: latestSampleIdBeforeTests } = await knex('Sample').max('id as id').first())
          ;({ id: latestResultIdBeforeTests } = await knex('Result').max('id as id').first())
          ;({ id: latestCaseIdBeforeTests } = await knex('PatientCase').max('id as id').first())
        })

        after(async () => {
          await knex('Result').where('id', '>', latestResultIdBeforeTests).del()
          await knex('Sample').where('id', '>', latestSampleIdBeforeTests).del()
          await knex('PatientCase').where('id', '>', latestCaseIdBeforeTests).del()
        })

        function getOptionValueFromTitle(options, title) {
          // eslint-disable-next-line eqeqeq
          return (options.find(option => option.title == title) || {}).value
        }

        async function getAssayForDiseaseIdAndDeviceType(diseaseId, deviceTypeExternalId) {
          const { assayExternalId } = await knex('DeviceType as dt')
            .join('Assay as a', 'dt.id', 'a.deviceTypeId')
            .join('AssayType as at', 'a.assayTypeId', 'at.id')
            .where('dt.externalId', deviceTypeExternalId)
            .andWhere('at.diseaseId', diseaseId)
            .first('a.externalId as assayExternalId')
          return assayExternalId
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
          const gender = getOptionValueFromTitle(AssayCovidResultFormSchema.fields.gender.control.options, genderText)
          const resultText = 'Positive'
          const testResult = getOptionValueFromTitle(
            AssayCovidResultFormSchema.fields.testResult.control.options,
            resultText
          )
          await Promise.each(Object.keys(covidDeviceTypeDevices), async deviceTypeId => {
            const assayExternalId = await getAssayForDiseaseIdAndDeviceType(diseaseId, deviceTypeId)
            const caseId = getCaseIdByDeviceTypeId(deviceTypeId)
            let testTypeText
            let testType
            const resultId = await createResult(partnerId, deviceTypeId, 'Nasal Swab', assayExternalId, otherUserId)
            const formDataToSend = {
              caseId,
              testReason,
              age,
              gender,
              testResult,
              dateAndTimeOfTest,
            }
            const resultAspectExpected = {}
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
            expect(response.status).to.equal(200)
            expect(response.body.data.id).to.equal(resultId)
            const result = await getResult(resultId)
            result.patientData = JSON.parse(result.patientData)
            result.resultData = JSON.parse(result.resultData)
            result.formData = JSON.parse(result.formData)

            const expectedResult = {
              patientData: {
                id: caseId,
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
              ...resultAspectExpected,
            }
            expect(result).to.containSubset(expectedResult)
          })
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
          const gender = getOptionValueFromTitle(AssayCovidResultFormSchema.fields.gender.control.options, genderText)
          const resultText = 'Negative'
          const testResult = getOptionValueFromTitle(
            AssayCovidResultFormSchema.fields.testResult.control.options,
            resultText
          )
          await Promise.each(Object.keys(covidDeviceTypeDevices), async deviceTypeId => {
            const assayExternalId = await getAssayForDiseaseIdAndDeviceType(diseaseId, deviceTypeId)
            const caseId = getCaseIdByDeviceTypeId(deviceTypeId)
            let testTypeText
            let testType
            const resultId = await createResult(partnerId, deviceTypeId, 'Nasal Swab', assayExternalId, otherUserId)
            const formDataToSend = {
              caseId,
              testReason,
              age,
              gender,
              testResult,
              dateAndTimeOfTest,
            }
            const resultAspectExpected = {}
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

            expect(response.status).to.equal(200)
            expect(response.body.data.id).to.equal(resultId)
            const result = await getResult(resultId)
            result.patientData = JSON.parse(result.patientData)
            result.resultData = JSON.parse(result.resultData)
            result.formData = JSON.parse(result.formData)
            expect(result).to.containSubset({
              patientData: {
                id: caseId,
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
              ...resultAspectExpected,
            })
            const deviceLogsForResult = await knex('DeviceLog').where({ resultId }).select()
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
          })
        })

        it('Should NOT overwrite diagnostic data if the result has already come from an instrument', async () => {
          const dateAndTimeOfTest = new Date(2020, 3, 14)
          const testReasonText = 'Ill Seeking Healthcare due to suspicion of COVID-19'
          const testReason = getOptionValueFromTitle(
            AssayCovidResultFormSchema.fields.testReason.control.options,
            testReasonText
          )
          const age = 78
          const genderText = 'Male'
          const gender = getOptionValueFromTitle(AssayCovidResultFormSchema.fields.gender.control.options, genderText)
          const resultText = 'Negative'
          const testResult = getOptionValueFromTitle(
            AssayCovidResultFormSchema.fields.testResult.control.options,
            resultText
          )
          await Promise.each(Object.keys(covidDeviceTypeDevices), async deviceTypeId => {
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
            const assayExternalId = await getAssayForDiseaseIdAndDeviceType(diseaseId, deviceTypeId)
            const caseId = getCaseIdByDeviceTypeId(deviceTypeId)
            let testTypeText
            let testType
            const resultId = await createResult(
              partnerId,
              deviceTypeId,
              'Nasal Swab',
              assayExternalId,
              otherUserId,
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
            const resultAspectExpected = {}
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

            expect(response.status).to.equal(200)
            expect(response.body.data.id).to.equal(resultId)
            const result = await getResult(resultId)
            result.patientData = JSON.parse(result.patientData)
            result.resultData = JSON.parse(result.resultData)
            result.formData = JSON.parse(result.formData)
            if (deviceTypeId !== 'Aspect') {
              expect(result).to.containSubset({
                patientData: {
                  id: patientDataFromInstrument.id,
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
                ...resultAspectExpected,
              })
            } else {
              expect(result).to.containSubset({
                patientData: {
                  id: caseId,
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
                ...resultAspectExpected,
              })
            }
            const deviceLogsForResult = await knex('DeviceLog').where({ resultId }).select()
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
          })
        })
      })
    })
  })
})
