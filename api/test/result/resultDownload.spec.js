const chai = require('chai')
const _ = require('lodash')
const Promise = require('bluebird')
const shared = require('../utils/sharedToken')

const { generateResults, setTreatmentStatusToResults } = require('../../seeds/commonGenerateResults')
const patients = require('../../seeds/test/fixtures/patients.json')

const { knex } = require('../../src/db')

const { resultCategoryToId } = require('../../src/shared/dictionary')

const server = require('../utils/testUtils')
const { getBaseQueryForResults } = require('../../src/result/common/db')

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
  let totalResults

  before(async () => {
    shared.checkToken(server, path)
    clinicianAccessToken = await getClinicianAccessToken()
  })

  beforeEach(async () => {
    const { partnerId, userId } = await knex('Person as p')
      .innerJoin('User as u')
      .where('u.name', 'admin')
      .first('p.lastPartnerId as partnerId', 'p.id as personId', 'p.userId')

    results = await generateResults(knex, userId, partnerId, patients, [], 'US', false, 30, 0, 0, 0)

    await setTreatmentStatusToResults(knex, results, ['OnTreatment'])

    // set all to a reportable result (=detected)
    const resultCategoryId = await resultCategoryToId('Detected')
    await knex('Result').whereIn('id', _.map(results, 'id')).update('resultCategory1', resultCategoryId)

    /**
     * notice that query in 'api/src/result/service.js' func 'getDownloadResultsList'
     * applies constraints which, by default, deal with only approved devices.
     * And because above func 'generateResults' generates also results for non-approved
     * devices (for randomly used sites) - we need to narrow obtained `results` for only approved devices.
     * So, use for that same base query as in func 'getDownloadResultsList' with WHERE
     * for 'approved' device or NULL
     */
    const reportableResultIds = await getBaseQueryForResults()
      .clone()
      .leftOuterJoin(`DeviceApproval as deviceApproval`, `d.deviceApprovalId`, `deviceApproval.id`)
      .where(function () {
        this.where({ [`deviceApproval.token`]: 'approved' }).orWhere(knex.raw('isnull(`deviceApproval`.`token`)'))
      })
      .whereIn(
        'r.id',
        results.map(({ id }) => id)
      )
      .andWhere('dt.externalId', 'CepheidGeneXpert')
      .pluck('r.id')
    /**
     * leave only valid results
     */
    results = results.filter(({ id }) => reportableResultIds.includes(id))
    totalResults = results.length
  })

  afterEach(async () => {
    await knex('ResultFollowUp').whereIn('resultId', _.map(results, 'id')).delete()

    await knex('ResultDownloadLog').whereIn('resultId', _.map(results, 'id')).delete()

    await knex('Result').whereIn('id', _.map(results, 'id')).delete()
  })

  describe('GET', () => {
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

    function assertReporterResultDownloadResponseContainingResults(response, numberOfResults) {
      assertReporterResultDownloadResponse(response)

      assert.equal(response.body.total, numberOfResults)
      assert.equal(response.body.length, numberOfResults)

      assert.equal(Object.keys(response.body.data[0]).length, 23)
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
        assert.property(response.body.data[0].followUps[0], 'followUpTypeExternalId')
        assert.property(response.body.data[0].followUps[0], 'followUpExternalId')
        assert.property(response.body.data[0].followUps[0], 'followUpi18nKey')
        assert.property(response.body.data[0].followUps[0], 'followUpName')
        assert.property(response.body.data[0].followUps[0], 'followUpTypei18nKey')
        assert.property(response.body.data[0].followUps[0], 'followUpTypeName')
        assert.property(response.body.data[0].followUps[0], 'date')
        assert.property(response.body.data[0].followUps[0], 'createdOn')
        assert.property(response.body.data[0].followUps[0], 'updatedOn')
      }
    }

    it('should return a paged list of results', async () => {
      const res = await server
        .get(`${path}?size=${totalResults}&deviceType=CepheidGeneXpert`)
        .set('Authorization', `Bearer ${shared.token}`)
      assertReporterResultDownloadResponseContainingResults(res, totalResults)

      // we're not awaiting the insert before returning in service.js, so need a delay here
      await Promise.delay(1000)

      // check if the download is register in the table.
      const { count: totalResult } = await knex('ResultDownloadLog as rdl')
        .join('Result as r', 'rdl.resultId', 'r.id')
        .whereIn(
          'rdl.resultId',
          _.map(res.body.data, elem => elem.id)
        )
        .count('rdl.id as count')
        .first()

      assert.isAtLeast(totalResult, res.body.length)
    })

    it('should be able to handle different optional filter parameters', async () => {
      const resultCategories = ['Detected', 'Invalid', 'Error', 'Acknowledged', 'Processed']
      let res = await server
        .get(`${path}?size=${totalResults}&deviceType=CepheidGeneXpert&resultCategories=${resultCategories.join(',')}`)
        .set('Authorization', `Bearer ${shared.token}`)
      await Promise.delay(500)
      assertReporterResultDownloadResponseContainingResults(res, totalResults)

      res = await server
        .get(
          `${path}?size=${totalResults}&deviceType=CepheidGeneXpert&assayExternalIds=GxMtbRif,GxMtbRifUltra,GxMtbXdr`
        )
        .set('Authorization', `Bearer ${shared.token}`)
      await Promise.delay(500)
      assertReporterResultDownloadResponseContainingResults(res, totalResults)

      res = await server
        .get(`${path}?size=${totalResults}&patientSample=-&deviceType=CepheidGeneXpert`)
        .set('Authorization', `Bearer ${shared.token}`)
      await Promise.delay(1000)
      assertReporterResultDownloadResponseContainingResults(res, totalResults)
    })

    it('should return a paged list of results filtered by disease external id', async () => {
      const res = await server
        .get(path)
        .query({
          size: totalResults,
          deviceType: 'CepheidGeneXpert',
          diseaseExternalIds: 'tb,ebola,hiv',
        })
        .set('Authorization', `Bearer ${shared.token}`)
      await Promise.delay(1000)
      assertReporterResultDownloadResponseContainingResults(res, totalResults)
    })

    it('should return a paged list of results, including all result details, that the clinician has access to', async () => {
      // clinician only has access to Dayton, OH. Assign results so there's exactly 2 there
      const { id: siteIdDayton } = await knex('Site').where('externalId', 'OH_Dayton').first('id')

      const { id: siteIdWayne } = await knex('Site').where('externalId', 'Ohio_Wayne').first('id')

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
      await Promise.delay(1000)
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
