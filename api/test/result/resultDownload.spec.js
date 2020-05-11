const supertest = require('supertest')
const chai = require('chai')
const _ = require('lodash')
const shared = require('../utils/sharedToken')
const { waitForApproximately } = require('../utils/generatorFunctionUtils')
const { knex } = require('../../src/db')

const server = supertest.agent('http://localhost:8080')
const { assert } = chai
const getClinicianAccessToken = () =>
  server
    .post('/api/auth')
    .send({
      name: 'clinician',
      password: 'test07',
      clientName: 'Mocha web',
    })
    .then(res => res.body.access)
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
    it('should return a paged list of results and update them to delivered', async () => {
      await server
        .get(`${path}?size=10&deviceType=DaktariVirology`)
        .set('Authorization', `Bearer ${shared.token}`)
        .then(async res => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'ok')
          assert.property(res.body, 'total')
          assert.property(res.body, 'length')
          assert.property(res.body, 'data')

          assert.equal(res.body.ok, true)
          assert.isAtLeast(res.body.length, 1)

          assert.typeOf(res.body.data, 'array')
          assert.isAtLeast(res.body.data.length, 1)

          assert.property(res.body.data[0], 'id')
          assert.property(res.body.data[0], 'externalId')
          assert.property(res.body.data[0], 'endedOn')
          assert.property(res.body.data[0], 'updatedOn')
          assert.property(res.body.data[0], 'assayExternalId')
          assert.property(res.body.data[0], 'siteName')
          assert.property(res.body.data[0], 'reportableSiteId')
          assert.property(res.body.data[0], 'sampleOriginSiteId')
          assert.property(res.body.data[0], 'firstViewedOn')
          assert.property(res.body.data[0], 'deviceName')
          assert.property(res.body.data[0], 'resultCategory1ExternalId')
          assert.property(res.body.data[0], 'resultCategory2ExternalId')
          assert.property(res.body.data[0], 'workflowStatus')
          assert.equal(res.body.data[0].workflowStatus.externalId, 'Delivered')
          assert.property(res.body.data[0], 'treatmentStatus')
          assert.property(res.body.data[0], 'patientData')
          assert.property(res.body.data[0], 'resultData')
          assert.property(res.body.data[0], 'sample')
          assert.property(res.body.data[0], 'followUps')
          assert.typeOf(res.body.data[0].followUps, 'array')
          assert.property(res.body.data[0].followUps[0], 'id')
          assert.property(res.body.data[0].followUps[0], 'externalId')
          assert.property(res.body.data[0].followUps[0], 'followUpExternalId')
          assert.property(res.body.data[0].followUps[0], 'followUpi18nKey')
          assert.property(res.body.data[0].followUps[0], 'followUpName')
          assert.property(
            res.body.data[0].followUps[0],
            'followUpTypeExternalId'
          )
          assert.property(res.body.data[0].followUps[0], 'followUpTypei18nKey')
          assert.property(res.body.data[0].followUps[0], 'followUpTypeName')
          assert.property(res.body.data[0].followUps[0], 'date')
          assert.property(res.body.data[0].followUps[0], 'createdOn')
          assert.property(res.body.data[0].followUps[0], 'updatedOn')
          assert.property(res.body.data[0], 'comments')
          assert.typeOf(res.body.data[0].followUps, 'array')
          assert.property(res.body.data[0].followUps[0], 'id')

          assert.equal(Object.keys(res.body.data[0]).length, 24)
          await waitForApproximately(2, 'seconds')

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
    })

    it('should test querying different results with different optional parameters', async () => {
      const resultCategories = [
        'Detected',
        'Invalid',
        'Error',
        'Acknowledged',
        'Processed',
      ]
      await server
        .get(
          `${path}?size=1&deviceType=DaktariVirology&resultCategories=${resultCategories.join(
            ','
          )}`
        )
        .set('Authorization', `Bearer ${shared.token}`)
        .then(res => {
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
          assert.property(res.body.data[0], 'endedOn')
          assert.property(res.body.data[0], 'updatedOn')
          assert.property(res.body.data[0], 'assayExternalId')
          assert.property(res.body.data[0], 'siteName')
          assert.property(res.body.data[0], 'reportableSiteId')
          assert.property(res.body.data[0], 'sampleOriginSiteId')
          assert.property(res.body.data[0], 'firstViewedOn')
          assert.property(res.body.data[0], 'deviceName')
          assert.property(res.body.data[0], 'resultCategory1ExternalId')
          assert.property(res.body.data[0], 'resultCategory2ExternalId')
          assert.property(res.body.data[0], 'workflowStatus')
          assert.equal(res.body.data[0].workflowStatus.externalId, 'Delivered')
          assert.property(res.body.data[0], 'treatmentStatus')
          assert.property(res.body.data[0], 'patientData')
          assert.property(res.body.data[0], 'resultData')
          assert.property(res.body.data[0], 'sample')
          assert.property(res.body.data[0], 'followUps')
          assert.typeOf(res.body.data[0].followUps, 'array')
          assert.property(res.body.data[0].followUps[0], 'id')
          assert.property(res.body.data[0].followUps[0], 'externalId')
          assert.property(res.body.data[0].followUps[0], 'followUpExternalId')
          assert.property(res.body.data[0].followUps[0], 'followUpi18nKey')
          assert.property(res.body.data[0].followUps[0], 'followUpName')
          assert.property(
            res.body.data[0].followUps[0],
            'followUpTypeExternalId'
          )
          assert.property(res.body.data[0].followUps[0], 'followUpTypei18nKey')
          assert.property(res.body.data[0].followUps[0], 'followUpTypeName')
          assert.property(res.body.data[0].followUps[0], 'date')
          assert.property(res.body.data[0].followUps[0], 'createdOn')
          assert.property(res.body.data[0].followUps[0], 'updatedOn')
          assert.property(res.body.data[0], 'comments')
          assert.typeOf(res.body.data[0].followUps, 'array')
          assert.property(res.body.data[0].followUps[0], 'id')

          assert.equal(Object.keys(res.body.data[0]).length, 24)
        })

      await server
        .get(
          `${path}?size=1&deviceType=DaktariVirology&assayExternalIds=GxMtbRif,GxEbola,GxHiv1Vl,GxHcv,DaktariHivVL`
        )
        .set('Authorization', `Bearer ${shared.token}`)
        .then(res => {
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
          assert.property(res.body.data[0], 'endedOn')
          assert.property(res.body.data[0], 'updatedOn')
          assert.property(res.body.data[0], 'assayExternalId')
          assert.property(res.body.data[0], 'siteName')
          assert.property(res.body.data[0], 'reportableSiteId')
          assert.property(res.body.data[0], 'sampleOriginSiteId')
          assert.property(res.body.data[0], 'firstViewedOn')
          assert.property(res.body.data[0], 'deviceName')
          assert.property(res.body.data[0], 'resultCategory1ExternalId')
          assert.property(res.body.data[0], 'resultCategory2ExternalId')
          assert.property(res.body.data[0], 'workflowStatus')
          assert.property(res.body.data[0], 'treatmentStatus')
          assert.property(res.body.data[0], 'patientData')
          assert.property(res.body.data[0], 'resultData')
          assert.property(res.body.data[0], 'sample')
          assert.equal(res.body.data[0].workflowStatus.externalId, 'Delivered')
        })
      await server
        .get(`${path}?size=1&workflowStatus=OK`)
        .set('Authorization', `Bearer ${shared.token}`)
        .then(res => {
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
      await server
        .get(`${path}?size=1&treatmentStatus=OnTreatment`)
        .set('Authorization', `Bearer ${shared.token}`)
        .then(res => {
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
      await server
        .get(`${path}?size=1&patientSample=-&deviceType=DaktariVirology`)
        .set('Authorization', `Bearer ${shared.token}`)
        .then(res => {
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
          assert.property(res.body.data[0], 'endedOn')
          assert.property(res.body.data[0], 'updatedOn')
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
          assert.property(res.body.data[0], 'sample')
        })
    })

    it('should return a paged list of results filtered by disease external id', async () => {
      const res = await server
        .get(
          `${path}?size=1&deviceType=DaktariVirology&diseaseExternalIds=tb,ebola,hiv`
        )
        .set('Authorization', `Bearer ${shared.token}`)
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
      assert.property(res.body.data[0], 'endedOn')
      assert.property(res.body.data[0], 'updatedOn')
      assert.property(res.body.data[0], 'assayExternalId')
      assert.property(res.body.data[0], 'diseaseExternalId')
      assert.property(res.body.data[0], 'diseaseName')
      assert.property(res.body.data[0], 'siteName')
      assert.property(res.body.data[0], 'reportableSiteId')
      assert.property(res.body.data[0], 'sampleOriginSiteId')
      assert.property(res.body.data[0], 'firstViewedOn')
      assert.property(res.body.data[0], 'deviceName')
      assert.property(res.body.data[0], 'resultCategory1ExternalId')
      assert.property(res.body.data[0], 'resultCategory2ExternalId')
      assert.property(res.body.data[0], 'workflowStatus')
      assert.property(res.body.data[0], 'treatmentStatus')
      assert.property(res.body.data[0], 'patientData')
      assert.property(res.body.data[0], 'resultData')
      assert.property(res.body.data[0], 'sample')
      assert.equal(res.body.data[0].workflowStatus.externalId, 'Delivered')
    })

    it('should return a paged list of results, including all result details, that the clinician has access to', async () => {
      await server
        .get(`${path}?deviceType=DaktariVirology`)
        .set('Authorization', `Bearer ${clinicianAccessToken}`)
        .then(async res => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')

          assert.property(res.body, 'ok')
          assert.property(res.body, 'total')
          assert.property(res.body, 'length')
          assert.property(res.body, 'data')

          assert.equal(res.body.ok, true)
          assert.isAtLeast(res.body.length, 2)

          assert.typeOf(res.body.data, 'array')
          assert.isAtLeast(res.body.data.length, 2)

          assert.property(res.body.data[0], 'id')
          assert.property(res.body.data[0], 'externalId')
          assert.property(res.body.data[0], 'endedOn')
          assert.property(res.body.data[0], 'updatedOn')
          assert.property(res.body.data[0], 'assayExternalId')
          assert.property(res.body.data[0], 'siteName')
          assert.property(res.body.data[0], 'reportableSiteId')
          assert.property(res.body.data[0], 'sampleOriginSiteId')
          assert.property(res.body.data[0], 'firstViewedOn')
          assert.property(res.body.data[0], 'deviceName')
          assert.property(res.body.data[0], 'resultCategory1ExternalId')
          assert.property(res.body.data[0], 'resultCategory2ExternalId')
          assert.property(res.body.data[0], 'workflowStatus')
          assert.equal(res.body.data[0].workflowStatus.externalId, 'Delivered')
          assert.property(res.body.data[0], 'treatmentStatus')
          assert.property(res.body.data[0], 'patientData')
          assert.property(res.body.data[0], 'resultData')
          assert.property(res.body.data[0], 'sample')

          assert.property(res.body.data[0], 'followUps')
          assert.typeOf(res.body.data[0].followUps, 'array')
          assert.property(res.body.data[0].followUps[0], 'id')
          assert.property(res.body.data[0].followUps[0], 'externalId')
          assert.property(res.body.data[0].followUps[0], 'followUpExternalId')
          assert.property(res.body.data[0].followUps[0], 'followUpi18nKey')
          assert.property(res.body.data[0].followUps[0], 'followUpName')
          assert.property(
            res.body.data[0].followUps[0],
            'followUpTypeExternalId'
          )
          assert.property(res.body.data[0].followUps[0], 'followUpTypei18nKey')
          assert.property(res.body.data[0].followUps[0], 'followUpTypeName')
          assert.property(res.body.data[0].followUps[0], 'date')
          assert.property(res.body.data[0].followUps[0], 'createdOn')
          assert.property(res.body.data[0].followUps[0], 'updatedOn')
          assert.property(res.body.data[0], 'comments')
          assert.typeOf(res.body.data[0].followUps, 'array')
          assert.property(res.body.data[0].followUps[0], 'id')

          assert.equal(Object.keys(res.body.data[0]).length, 24)
          // check if the download is register in the table.
          const { count: totalResult } = await knex('ResultDownloadLog')
            .where('resultId', res.body.data[0].id)
            .count('id as count')
            .first()

          assert.isAtLeast(totalResult, 1)
        })
    })
  })
})
