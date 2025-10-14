const chai = require('chai')
const chaiSubset = require('chai-subset')
const _ = require('lodash')
const { addMinutes, subDays } = require('date-fns')
const Promise = require('bluebird')
const { createGxConnectTestContext } = require('../deviceApi/geneXpert/gxconnect_utils')
const shared = require('../utils/sharedToken')
const { resultCategoryToId, resultStatusToId } = require('../../src/shared/dictionary')
const { knex } = require('../../src/db')
const server = require('../utils/testUtils')
const { addResultDownloadLog } = require('../../src/result/service')

const { assert } = chai.use(chaiSubset)

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
  const assayId = 1
  let clinicianAssayId = 1
  let clinicianResultId = 1

  let clinicianAccessToken = ''
  before(async () => {
    shared.checkToken(server, path)
    clinicianAccessToken = await getClinicianAccessToken()
    const {
      body: { data: clinicianAccessibleResults },
    } = await server.get(path).set('Authorization', `Bearer ${clinicianAccessToken}`)

    try {
      clinicianAssayId = clinicianAccessibleResults[0].assayId
      clinicianResultId = clinicianAccessibleResults[0].id
    } catch (e) {
      //
    }
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
      assert.property(res.body.data[0], 'resultTreatmentStatus')
      assert.property(res.body.data[0], 'treatmentStatusInfo')
      assert.property(res.body.data[0], 'patientId')
      assert.property(res.body.data[0], 'assayId')
      assert.property(res.body.data[0], 'caseExternalId')
      assert.property(res.body, 'total')
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
      const { caseId } = await knex('Result as r')
        .join('PatientCase as p', 'r.patientCaseId', 'p.id')
        .first('p.externalId as caseId')
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
  })
})
