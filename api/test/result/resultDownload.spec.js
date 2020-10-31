const chai = require('chai')
const _ = require('lodash')
const shared = require('../utils/sharedToken')
const { waitForApproximately } = require('../utils/generatorFunctionUtils')
const { knex } = require('../../src/db')

const server = require('../utils/testUtils')

const { assert, expect } = chai
const getClinicianAccessToken = async () => {
  const res = await server.post('/api/auth').send({
    name: 'clinician',
    password: 'test07',
    clientName: 'Mocha web',
  })
  return res.body.access
}

describe('Result download routes', () => {
  const path = '/api/result/download'

  let clinicianAccessToken = ''
  before(async () => {
    clinicianAccessToken = await getClinicianAccessToken()
  })

  afterEach(async () => {
    await knex('ResultDownloadLog').delete()
  })
  describe('GET', () => {
    shared.checkToken(server, path)

    function assertReporterResultDownloadResponse(response) {
      expect(response).to.containSubset({
        status: 200,
        body: {
          ok: true,
          data: [],
        },
      })
      assert.property(response.body, 'total')
      assert.property(response.body, 'length')
      assert.property(response.body, 'data')
    }

    function assertReporterResultDownloadResponseContainingNoResults(response) {
      assertReporterResultDownloadResponse(response)
      assert.isAtLeast(response.body.total, 0)
      assert.equal(response.body.length, 0)

      assert.typeOf(response.body.data, 'array')
      assert.equal(response.body.data.length, 0)
    }

    function assertReporterResultDownloadResponseContainingResults(
      response,
      minimumNumberOfRestults = 1
    ) {
      assertReporterResultDownloadResponse(response)

      expect(response).to.containSubset({
        body: {
          data: [
            {
              workflowStatus: {
                externalId: 'Delivered',
              },
            },
          ],
        },
      })
      assert.isAtLeast(response.body.total, minimumNumberOfRestults)
      assert.isAtLeast(response.body.length, minimumNumberOfRestults)
      assert.equal(Object.keys(response.body.data[0]).length, 24)
      assert.property(response.body.data[0], 'id')
      assert.property(response.body.data[0], 'externalId')
      assert.property(response.body.data[0], 'endedOn')
      assert.property(response.body.data[0], 'updatedOn')
      assert.property(response.body.data[0], 'assayExternalId')
      assert.property(response.body.data[0], 'siteName')
      assert.property(response.body.data[0], 'reportableSiteId')
      assert.property(response.body.data[0], 'sampleOriginSiteId')
      assert.property(response.body.data[0], 'firstViewedOn')
      assert.property(response.body.data[0], 'deviceName')
      assert.property(response.body.data[0], 'resultCategory1ExternalId')
      assert.property(response.body.data[0], 'resultCategory2ExternalId')
      assert.property(response.body.data[0], 'workflowStatus')
      assert.property(response.body.data[0], 'treatmentStatus')
      assert.property(response.body.data[0], 'patientData')
      assert.property(response.body.data[0], 'resultData')
      assert.property(response.body.data[0], 'sample')
      assert.property(response.body.data[0], 'followUps')
      assert.typeOf(response.body.data[0].followUps, 'array')
      assert.property(response.body.data[0].followUps[0], 'id')
      assert.property(response.body.data[0].followUps[0], 'externalId')
      assert.property(
        response.body.data[0].followUps[0],
        'followUpTypeExternalId'
      )
      assert.property(response.body.data[0].followUps[0], 'followUpExternalId')
      assert.property(response.body.data[0].followUps[0], 'followUpi18nKey')
      assert.property(response.body.data[0].followUps[0], 'followUpName')
      assert.property(response.body.data[0].followUps[0], 'followUpTypei18nKey')
      assert.property(response.body.data[0].followUps[0], 'followUpTypeName')
      assert.property(response.body.data[0].followUps[0], 'date')
      assert.property(response.body.data[0].followUps[0], 'createdOn')
      assert.property(response.body.data[0].followUps[0], 'updatedOn')
      assert.property(response.body.data[0], 'comments')
      assert.typeOf(response.body.data[0].followUps, 'array')
    }

    it('should return a paged list of results and update them to delivered', async () => {
      const res = await server
        .get(`${path}?size=10&deviceType=DaktariVirology`)
        .set('Authorization', `Bearer ${shared.token}`)
      assertReporterResultDownloadResponseContainingResults(res)

      await waitForApproximately(3, 'seconds')

      // check if the download is register in the table.
      const { count: totalResult } = await knex('ResultDownloadLog as rdl')
        .join('Result as r', 'rdl.resultId', 'r.id')
        .join(
          'ResultWorkflowLog as rsl',
          'r.resultWorkflowStatusLogId',
          'rsl.id'
        )
        .join(
          'ResultWorkflowStatus as rs',
          'rs.id',
          'rsl.resultWorkflowStatusId'
        )
        .whereIn(
          'rdl.resultId',
          _.map(res.body.data, elem => elem.id)
        )
        .where('rs.externalId', 'Delivered')
        .count('rdl.id as count')
        .first()

      assert.isAtLeast(totalResult, res.body.length)
    })

    it('should test querying different results with different optional parameters', async () => {
      const resultCategories = [
        'Detected',
        'Invalid',
        'Error',
        'Acknowledged',
        'Processed',
      ]
      let res = await server
        .get(
          `${path}?size=1&deviceType=DaktariVirology&resultCategories=${resultCategories.join(
            ','
          )}`
        )
        .set('Authorization', `Bearer ${shared.token}`)
      assertReporterResultDownloadResponseContainingResults(res)

      res = await server
        .get(
          `${path}?size=1&deviceType=DaktariVirology&assayExternalIds=GxMtbRif,GxEbola,GxHiv1Vl,GxHcv,DaktariHivVL`
        )
        .set('Authorization', `Bearer ${shared.token}`)
      assertReporterResultDownloadResponseContainingResults(res)

      res = await server
        .get(`${path}?size=1&workflowStatus=OK`)
        .set('Authorization', `Bearer ${shared.token}`)
      assertReporterResultDownloadResponseContainingNoResults(res)

      res = await server
        .get(`${path}?size=1&treatmentStatus=OnTreatment`)
        .set('Authorization', `Bearer ${shared.token}`)
      assertReporterResultDownloadResponseContainingResults(res)

      res = await server
        .get(`${path}?size=1&patientSample=-&deviceType=DaktariVirology`)
        .set('Authorization', `Bearer ${shared.token}`)
      assertReporterResultDownloadResponseContainingResults(res)
    })

    it('should return a paged list of results filtered by disease external id', async () => {
      const res = await server
        .get(path)
        .query({
          size: 1,
          deviceType: 'DaktariVirology',
          diseaseExternalIds: 'tb,ebola,hiv',
        })
        .set('Authorization', `Bearer ${shared.token}`)
      assertReporterResultDownloadResponseContainingResults(res)
    })

    it('should return a paged list of results, including all result details, that the clinician has access to', async () => {
      const res = await server
        .get(`${path}?deviceType=DaktariVirology`)
        .set('Authorization', `Bearer ${clinicianAccessToken}`)
      assertReporterResultDownloadResponseContainingResults(res, 2)
      // check if the download is register in the table.
      const { count: totalResult } = await knex('ResultDownloadLog')
        .where('resultId', res.body.data[0].id)
        .count('id as count')
        .first()

      assert.isAtLeast(totalResult, 1)
    })
  })
})
