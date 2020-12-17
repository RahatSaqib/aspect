const chai = require('chai')
const _ = require('lodash')
const shared = require('../utils/sharedToken')

const {
  generateResults,
  setTreatmentStatusToResults,
} = require('../../seeds/commonGenerateResults')
const patients = require('../../seeds/test/fixtures/patients.json')

const { knex } = require('../../src/db')

const {
  resultCategoryToId,
  resultWorkflowStatusToId,
} = require('../../src/shared/dictionary')

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
  let results = []

  before(async () => {
    clinicianAccessToken = await getClinicianAccessToken()
  })

  beforeEach(async () => {
    const { partnerId, userId } = await knex('Person as p')
      .innerJoin('User as u')
      .where('u.name', 'admin')
      .first('p.lastPartnerId as partnerId', 'p.id as personId', 'p.userId')

    results = await generateResults(
      knex,
      userId,
      partnerId,
      patients,
      [],
      'US',
      false,
      5,
      0,
      0,
      0
    )

    await setTreatmentStatusToResults(knex, results, ['OnTreatment'])

    // set all to deliverable
    const resultWorkflowStatusId = await resultWorkflowStatusToId('Deliverable')
    await knex('ResultWorkflowLog')
      .whereIn('resultId', _.map(results, 'id'))
      .update('resultWorkflowStatusId', resultWorkflowStatusId)

    // set all to a reportable result (=detected)
    const resultCategoryId = await resultCategoryToId('Detected')
    await knex('Result')
      .whereIn('id', _.map(results, 'id'))
      .update('resultCategory1', resultCategoryId)
  })

  afterEach(async () => {
    await knex('ResultFollowUp')
      .whereIn('resultId', _.map(results, 'id'))
      .delete()

    await knex('ResultDownloadLog')
      .whereIn('resultId', _.map(results, 'id'))
      .delete()

    await knex('Result').whereIn('id', _.map(results, 'id')).delete()
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
      numberOfResults = 5
    ) {
      assertReporterResultDownloadResponse(response)

      assert.equal(response.body.total, numberOfResults)
      assert.equal(response.body.length, numberOfResults)
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
      assert.property(response.body.data[0], 'comments')
      assert.property(response.body.data[0], 'followUps')
      if (response.body.data[0].followUps) {
        assert.typeOf(response.body.data[0].followUps, 'array')
        assert.property(response.body.data[0].followUps[0], 'id')
        assert.property(response.body.data[0].followUps[0], 'externalId')
        assert.property(
          response.body.data[0].followUps[0],
          'followUpTypeExternalId'
        )
        assert.property(
          response.body.data[0].followUps[0],
          'followUpExternalId'
        )
        assert.property(response.body.data[0].followUps[0], 'followUpi18nKey')
        assert.property(response.body.data[0].followUps[0], 'followUpName')
        assert.property(
          response.body.data[0].followUps[0],
          'followUpTypei18nKey'
        )
        assert.property(response.body.data[0].followUps[0], 'followUpTypeName')
        assert.property(response.body.data[0].followUps[0], 'date')
        assert.property(response.body.data[0].followUps[0], 'createdOn')
        assert.property(response.body.data[0].followUps[0], 'updatedOn')
      }
    }

    it('should return a paged list of results and update them to delivered', async () => {
      const res = await server
        .get(`${path}?size=10&deviceType=CepheidGeneXpert`)
        .set('Authorization', `Bearer ${shared.token}`)
      assertReporterResultDownloadResponseContainingResults(res)

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
          `${path}?size=20&deviceType=CepheidGeneXpert&resultCategories=${resultCategories.join(
            ','
          )}`
        )
        .set('Authorization', `Bearer ${shared.token}`)
      assertReporterResultDownloadResponseContainingResults(res)

      res = await server
        .get(
          `${path}?size=20&deviceType=CepheidGeneXpert&assayExternalIds=GxMtbRif,GxEbola,GxHiv1Vl,GxHcv`
        )
        .set('Authorization', `Bearer ${shared.token}`)
      assertReporterResultDownloadResponseContainingResults(res)

      res = await server
        .get(
          `${path}?size=20&deviceType=CepheidGeneXpert&workflowStatus=Deliverable`
        )
        .set('Authorization', `Bearer ${shared.token}`)
      assertReporterResultDownloadResponseContainingNoResults(res)

      res = await server
        .get(
          `${path}?size=20&deviceType=CepheidGeneXpert&treatmentStatus=OnTreatment`
        )
        .set('Authorization', `Bearer ${shared.token}`)
      // assertReporterResultDownloadResponseContainingResults(res)

      res = await server
        .get(`${path}?size=20&patientSample=-&deviceType=CepheidGeneXpert`)
        .set('Authorization', `Bearer ${shared.token}`)
      assertReporterResultDownloadResponseContainingResults(res)
    })

    it('should return a paged list of results filtered by disease external id', async () => {
      const res = await server
        .get(path)
        .query({
          size: 10,
          deviceType: 'CepheidGeneXpert',
          diseaseExternalIds: 'tb,ebola,hiv',
        })
        .set('Authorization', `Bearer ${shared.token}`)
      assertReporterResultDownloadResponseContainingResults(res)
    })

    it('should return a paged list of results, including all result details, that the clinician has access to', async () => {
      // clinician only has access to Dayton, OH. Assign results so there's exactly 2 there
      const { id: siteIdDayton } = await knex('Site')
        .where('externalId', 'OH_Dayton')
        .first('id')

      const { id: siteIdWayne } = await knex('Site')
        .where('externalId', 'Ohio_Wayne')
        .first('id')

      await Promise.all(
        _.map(results, async (r, i) => {
          await knex('Result')
            .where({ id: r.id })
            .update({ reportableSiteId: i < 2 ? siteIdDayton : siteIdWayne })
        })
      )

      // query server
      const res = await server
        .get(`${path}?deviceType=CepheidGeneXpert`)
        .set('Authorization', `Bearer ${clinicianAccessToken}`)
      assertReporterResultDownloadResponseContainingResults(res, 2)
      // check if the download is register in the table.
      const { count: totalResult } = await knex('ResultDownloadLog')
        .where('resultId', res.body.data[0].id)
        .count('id as count')
        .first()

      assert.equal(totalResult, 1)
    })
  })
})
