const chai = require('chai')
const _ = require('lodash')
const Promise = require('bluebird')
const dayjs = require('dayjs')
const { pipe, find, values } = require('ramda')
const shared = require('../utils/sharedToken')

const { generateResults, setTreatmentStatusToResults } = require('../../seeds/commonGenerateResults')
const patients = require('../../seeds/test/fixtures/patients.json')
const { getBaseQueryForResults } = require('../../src/result/common/db')

const { knex } = require('../../src/db')

const { resultCategoryToId, resultWorkflowStatusToId } = require('../../src/shared/dictionary')

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

describe('Mobile API Result download routes v1 without api version', () => {
  const path = '/mobile/api/results'

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

    // set all to deliverable
    const resultWorkflowStatusId = await resultWorkflowStatusToId('Deliverable')
    await knex('ResultWorkflowLog')
      .whereIn('resultId', _.map(results, 'id'))
      .update('resultWorkflowStatusId', resultWorkflowStatusId)

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

    function assertReporterResultDownloadResponseContainingNoResults(response) {
      assertReporterResultDownloadResponse(response)
      assert.isAtLeast(response.body.total, 0)
      assert.equal(response.body.length, 0)

      assert.typeOf(response.body.data, 'array')
      assert.equal(response.body.data.length, 0)
    }

    function assertReporterResultDownloadResponseContainingResults(response, numberOfResults) {
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

    it('should return a paged list of results and update them to delivered', async () => {
      const res = await server
        .get(`${path}?size=${totalResults}&deviceType=CepheidGeneXpert`)
        .set('Authorization', `Bearer ${shared.token}`)
      assertReporterResultDownloadResponseContainingResults(res, totalResults)

      // we're not awaiting the insert before returning in service.js, so need a delay here
      await Promise.delay(1000)

      // check if the download is register in the table.
      const { count: totalResult } = await knex('ResultDownloadLog as rdl')
        .join('Result as r', 'rdl.resultId', 'r.id')
        .join('ResultWorkflowLog as rsl', 'r.resultWorkflowStatusLogId', 'rsl.id')
        .join('ResultWorkflowStatus as rs', 'rs.id', 'rsl.resultWorkflowStatusId')
        .whereIn(
          'rdl.resultId',
          _.map(res.body.data, elem => elem.id)
        )
        .where('rs.externalId', 'Delivered')
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
        .get(`${path}?size=${totalResults}&deviceType=CepheidGeneXpert&workflowStatus=Deliverable`)
        .set('Authorization', `Bearer ${shared.token}`)
      await Promise.delay(500)
      assertReporterResultDownloadResponseContainingNoResults(res)

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

    it('should return a paged list of results which server v1 endpoint, including all result details, that the clinician has access to', async () => {
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

describe('Mobile API Result download routes v1 with available custom api-version 1', () => {
  const path = '/mobile/api/results'

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

    // set all to deliverable
    const resultWorkflowStatusId = await resultWorkflowStatusToId('Deliverable')
    await knex('ResultWorkflowLog')
      .whereIn('resultId', _.map(results, 'id'))
      .update('resultWorkflowStatusId', resultWorkflowStatusId)

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

    function assertReporterResultDownloadResponseContainingNoResults(response) {
      assertReporterResultDownloadResponse(response)
      assert.isAtLeast(response.body.total, 0)
      assert.equal(response.body.length, 0)

      assert.typeOf(response.body.data, 'array')
      assert.equal(response.body.data.length, 0)
    }

    function assertReporterResultDownloadResponseContainingResults(response, numberOfResults) {
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

    it('should return a paged list of results and update them to delivered', async () => {
      const res = await server
        .get(`${path}?size=${totalResults}&deviceType=CepheidGeneXpert`)
        .set('Authorization', `Bearer ${shared.token}`)
        .set('api-version', `1`)
      assertReporterResultDownloadResponseContainingResults(res, totalResults)

      // we're not awaiting the insert before returning in service.js, so need a delay here
      await Promise.delay(1000)

      // check if the download is register in the table.
      const { count: totalResult } = await knex('ResultDownloadLog as rdl')
        .join('Result as r', 'rdl.resultId', 'r.id')
        .join('ResultWorkflowLog as rsl', 'r.resultWorkflowStatusLogId', 'rsl.id')
        .join('ResultWorkflowStatus as rs', 'rs.id', 'rsl.resultWorkflowStatusId')
        .whereIn(
          'rdl.resultId',
          _.map(res.body.data, elem => elem.id)
        )
        .where('rs.externalId', 'Delivered')
        .count('rdl.id as count')
        .first()

      assert.isAtLeast(totalResult, res.body.length)
    })

    it('should be able to handle different optional filter parameters', async () => {
      const resultCategories = ['Detected', 'Invalid', 'Error', 'Acknowledged', 'Processed']
      let res = await server
        .get(`${path}?size=${totalResults}&deviceType=CepheidGeneXpert&resultCategories=${resultCategories.join(',')}`)
        .set('Authorization', `Bearer ${shared.token}`)
        .set('api-version', `1`)
      await Promise.delay(500)
      assertReporterResultDownloadResponseContainingResults(res, totalResults)

      res = await server
        .get(
          `${path}?size=${totalResults}&deviceType=CepheidGeneXpert&assayExternalIds=GxMtbRif,GxMtbRifUltra,GxMtbXdr`
        )
        .set('Authorization', `Bearer ${shared.token}`)
        .set('api-version', `1`)
      await Promise.delay(500)
      assertReporterResultDownloadResponseContainingResults(res, totalResults)

      res = await server
        .get(`${path}?size=${totalResults}&deviceType=CepheidGeneXpert&workflowStatus=Deliverable`)
        .set('Authorization', `Bearer ${shared.token}`)
        .set('api-version', `1`)
      await Promise.delay(500)
      assertReporterResultDownloadResponseContainingNoResults(res)

      res = await server
        .get(`${path}?size=${totalResults}&patientSample=-&deviceType=CepheidGeneXpert`)
        .set('Authorization', `Bearer ${shared.token}`)
        .set('api-version', `1`)
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
        .set('api-version', `1`)
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
        .set('api-version', `1`)
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

describe('Mobile API Result download routes v2 with available custom api-version 2', () => {
  const path = '/mobile/api/results'

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

    // set all to deliverable
    const resultWorkflowStatusId = await resultWorkflowStatusToId('Deliverable')
    await knex('ResultWorkflowLog')
      .whereIn('resultId', _.map(results, 'id'))
      .update('resultWorkflowStatusId', resultWorkflowStatusId)

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
      assert.property(response.body, 'awaitingTreatment')
      if (!_.isNil(response.body.nextPage)) {
        assert.property(response.body, 'nextPage')
      }
    }

    function assertReporterResultDownloadResponseContainingNoResults(response) {
      assertReporterResultDownloadResponse(response)
      assert.isAtLeast(response.body.total, 0)
      assert.equal(response.body.length, 0)
      assert.isAtLeast(response.body.awaitingTreatment, 0)

      assert.typeOf(response.body.data, 'array')
      assert.equal(response.body.data.length, 0)
    }

    function assertReporterResultDownloadResponseContainingResults(response, numberOfResults) {
      assertReporterResultDownloadResponse(response)

      assert.equal(response.body.total, numberOfResults)
      assert.equal(response.body.length, numberOfResults)
      assert.isAtLeast(response.body.awaitingTreatment, 0)
      if (!_.isNil(response.body.nextPage)) {
        assert.isAtLeast(response.body.nextPage, 0)
      }
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

      assert.equal(Object.keys(response.body.data[0]).length, 28)
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
      assert.property(response.body.data[0], 'testId')
      assert.property(response.body.data[0], 'resultData')
      assert.property(response.body.data[0], 'sample')
      assert.property(response.body.data[0], 'comments')
      assert.property(response.body.data[0], 'followUps')
      assert.property(response.body.data[0], 'assayAvatar')
      assert.property(response.body.data[0], 'testInformation')
      assert.property(response.body.data[0], 'clinicalResponse')
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

    function assertReporterResultDownloadResponseContainingResultsWithTreatmentStatus(response, numberOfResults) {
      assertReporterResultDownloadResponse(response)

      assert.equal(response.body.total, numberOfResults)
      assert.equal(response.body.length, numberOfResults)
      assert.isAtLeast(response.body.awaitingTreatment, 0)
      if (!_.isNil(response.body.nextPage)) {
        assert.isAtLeast(response.body.nextPage, 0)
      }
      expect(response).to.containSubset({
        body: {
          data: [
            {
              treatmentStatus: {},
            },
          ],
        },
      })

      assert.equal(Object.keys(response.body.data[0].treatmentStatus).length, 7)
      if (response.body.data[0].treatmentStatus) {
        assert.property(response.body.data[0].treatmentStatus, 'changedOn')
        assert.property(response.body.data[0].treatmentStatus, 'name')
        assert.property(response.body.data[0].treatmentStatus, 'externalId')
        assert.property(response.body.data[0].treatmentStatus, 'i18nKey')
        assert.property(response.body.data[0].treatmentStatus, 'visible')
        assert.property(response.body.data[0].treatmentStatus, 'severity')
        assert.property(response.body.data[0].treatmentStatus, 'daysInCurrentStatus')
      }
    }

    function assertReporterResultDownloadResponseContainingTestInformation(response, numberOfResults) {
      assertReporterResultDownloadResponse(response)

      assert.equal(response.body.total, numberOfResults)
      assert.equal(response.body.length, numberOfResults)
      assert.isAtLeast(response.body.awaitingTreatment, 0)
      if (!_.isNil(response.body.nextPage)) {
        assert.isAtLeast(response.body.nextPage, 0)
      }
      expect(response).to.containSubset({
        body: {
          data: [
            {
              testInformation: {},
            },
          ],
        },
      })

      assert.equal(Object.keys(response.body.data[0].treatmentStatus).length, 7)
      if (response.body.data[0].treatmentStatus) {
        assert.property(response.body.data[0].testInformation[0], 'label')
        assert.property(response.body.data[0].testInformation[0], 'labelI18nKey')
        assert.property(response.body.data[0].testInformation[0], 'value')
        assert.property(response.body.data[0].testInformation[0], 'valueI18nKey')
        assert.property(response.body.data[0].testInformation[0], 'severity')
      }
    }

    function assertReporterResultDownloadResponseContainingClinicalResponse(response, numberOfResults) {
      assertReporterResultDownloadResponse(response)

      assert.equal(response.body.total, numberOfResults)
      assert.equal(response.body.length, numberOfResults)
      assert.isAtLeast(response.body.awaitingTreatment, 0)
      if (!_.isNil(response.body.nextPage)) {
        assert.isAtLeast(response.body.nextPage, 0)
      }
      expect(response).to.containSubset({
        body: {
          data: [
            {
              clinicalResponse: {},
            },
          ],
        },
      })

      if (response.body.data[0].clinicalResponse) {
        assert.property(response.body.data[0].clinicalResponse, 'recorded')
        if (response.body.data[0].clinicalResponse.recorded) {
          assert.property(response.body.data[0].clinicalResponse, 'confirmedOn')
          assert.equal(Object.keys(response.body.data[0].clinicalResponse).length, 6)
        }
        assert.property(response.body.data[0].clinicalResponse, 'treatment')
        assert.property(response.body.data[0].clinicalResponse, 'treatmentStarted')
        assert.property(response.body.data[0].clinicalResponse, 'outcome')
        assert.property(response.body.data[0].clinicalResponse, 'outcomeOccurred')
        assert.equal(Object.keys(response.body.data[0].clinicalResponse).length, 5)
      }
    }

    function treatmentStatusValidation(response) {
      const showTreatment = testResult => {
        return (
          testResult.treatmentStatus.externalId === 'OnTreatment' ||
          testResult.treatmentStatus.externalId === 'AwaitingTreatment'
        )
      }

      // get latest followup based on its type
      const checkFollowupType = (testResult, followUp, type) => {
        const followUps = _.sortBy(
          _.filter(followUp, { resultId: testResult.id }).map(f => _.omit(f, 'resultId')),
          ['date', 'updatedOn']
        )
        const maxDate = new Date(
          Math.max(
            ...followUps.map(element => {
              return element.createdOn
            })
          )
        )
        const followUpDetail = pipe(
          values,
          find(followUpDetail => {
            if (
              followUpDetail.followUpTypeExternalId === type &&
              new Date(followUpDetail.createdOn).toISOString() === new Date(maxDate).toISOString()
            ) {
              return followUpDetail
            }
          })
        )(followUps)
        return followUpDetail
      }

      // Its number of days from the day treatment has started/updated
      const daysFromTreatmentDateUpdateOn = (testResult, followUp) => {
        const isTreatment = checkFollowupType(testResult, followUp, 'treatment')
        return isTreatment ? dayjs().diff(dayjs(isTreatment.updatedOn), 'day') : 0
      }

      assert.equal(response.body.data[0].treatmentStatus.visible, showTreatment(response.body.data[0]))
      assert.equal(
        response.body.data[0].treatmentStatus.daysInCurrentStatus,
        daysFromTreatmentDateUpdateOn(response.body.data[0])
      )
    }

    function assertReporterResultDownloadResponseContainingResultsWithAssayAvatar(response, numberOfResults) {
      assertReporterResultDownloadResponse(response)

      assert.equal(response.body.total, numberOfResults)
      assert.equal(response.body.length, numberOfResults)
      assert.isAtLeast(response.body.awaitingTreatment, 0)
      if (!_.isNil(response.body.nextPage)) {
        assert.isAtLeast(response.body.nextPage, 0)
      }
      expect(response).to.containSubset({
        body: {
          data: [
            {
              assayAvatar: {
                contentI18nKey: 'assayTypeMtbRif',
                contentText: 'TB',
                backgroundColour: 'purple',
                foregroundColour: 'secondary',
                contentIcon: null,
              },
            },
          ],
        },
      })

      assert.equal(Object.keys(response.body.data[0]).length, 28)
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
      assert.property(response.body.data[0], 'testId')
      assert.property(response.body.data[0], 'resultData')
      assert.property(response.body.data[0], 'sample')
      assert.property(response.body.data[0], 'comments')
      assert.property(response.body.data[0], 'followUps')
      assert.property(response.body.data[0], 'assayAvatar')
      assert.property(response.body.data[0], 'testInformation')
      assert.property(response.body.data[0], 'clinicalResponse')
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

    it('should return a paged list of results and update them to delivered with assayAvatar purple', async () => {
      const res = await server
        .get(`${path}?size=${totalResults}&deviceType=CepheidGeneXpert`)
        .set('Authorization', `Bearer ${shared.token}`)
        .set('api-version', `31`)
      assertReporterResultDownloadResponseContainingResultsWithAssayAvatar(res, totalResults)

      // we're not awaiting the insert before returning in service.js, so need a delay here
      await Promise.delay(1000)

      // check if the download is register in the table.
      const { count: totalResult } = await knex('ResultDownloadLog as rdl')
        .join('Result as r', 'rdl.resultId', 'r.id')
        .join('ResultWorkflowLog as rsl', 'r.resultWorkflowStatusLogId', 'rsl.id')
        .join('ResultWorkflowStatus as rs', 'rs.id', 'rsl.resultWorkflowStatusId')
        .whereIn(
          'rdl.resultId',
          _.map(res.body.data, elem => elem.id)
        )
        .where('rs.externalId', 'Delivered')
        .count('rdl.id as count')
        .first()

      assert.isAtLeast(totalResult, res.body.length)
    })

    it('should return a paged list of results and update them to delivered with treatment status', async () => {
      const res = await server
        .get(`${path}?size=${totalResults}&deviceType=CepheidGeneXpert`)
        .set('Authorization', `Bearer ${shared.token}`)
        .set('api-version', `31`)
      assertReporterResultDownloadResponseContainingResultsWithTreatmentStatus(res, totalResults)

      // we're not awaiting the insert before returning in service.js, so need a delay here
      await Promise.delay(1000)

      // check if the download is register in the table.
      const { count: totalResult } = await knex('ResultDownloadLog as rdl')
        .join('Result as r', 'rdl.resultId', 'r.id')
        .join('ResultWorkflowLog as rsl', 'r.resultWorkflowStatusLogId', 'rsl.id')
        .join('ResultWorkflowStatus as rs', 'rs.id', 'rsl.resultWorkflowStatusId')
        .whereIn(
          'rdl.resultId',
          _.map(res.body.data, elem => elem.id)
        )
        .where('rs.externalId', 'Delivered')
        .count('rdl.id as count')
        .first()

      assert.isAtLeast(totalResult, res.body.length)
    })

    it('should return a paged list of results and update them to delivered with treatment status validation', async () => {
      const res = await server
        .get(`${path}?size=${totalResults}&deviceType=CepheidGeneXpert`)
        .set('Authorization', `Bearer ${shared.token}`)
        .set('api-version', `31`)
      treatmentStatusValidation(res)

      // we're not awaiting the insert before returning in service.js, so need a delay here
      await Promise.delay(1000)

      // check if the download is register in the table.
      const { count: totalResult } = await knex('ResultDownloadLog as rdl')
        .join('Result as r', 'rdl.resultId', 'r.id')
        .join('ResultWorkflowLog as rsl', 'r.resultWorkflowStatusLogId', 'rsl.id')
        .join('ResultWorkflowStatus as rs', 'rs.id', 'rsl.resultWorkflowStatusId')
        .whereIn(
          'rdl.resultId',
          _.map(res.body.data, elem => elem.id)
        )
        .where('rs.externalId', 'Delivered')
        .count('rdl.id as count')
        .first()

      assert.isAtLeast(totalResult, res.body.length)
    })

    it('should return a paged list of results and update them to delivered', async () => {
      const res = await server
        .get(`${path}?size=${totalResults}&deviceType=CepheidGeneXpert`)
        .set('Authorization', `Bearer ${shared.token}`)
        .set('api-version', `2`)
      assertReporterResultDownloadResponseContainingResults(res, totalResults)

      // we're not awaiting the insert before returning in service.js, so need a delay here
      await Promise.delay(1000)

      // check if the download is register in the table.
      const { count: totalResult } = await knex('ResultDownloadLog as rdl')
        .join('Result as r', 'rdl.resultId', 'r.id')
        .join('ResultWorkflowLog as rsl', 'r.resultWorkflowStatusLogId', 'rsl.id')
        .join('ResultWorkflowStatus as rs', 'rs.id', 'rsl.resultWorkflowStatusId')
        .whereIn(
          'rdl.resultId',
          _.map(res.body.data, elem => elem.id)
        )
        .where('rs.externalId', 'Delivered')
        .count('rdl.id as count')
        .first()

      assert.isAtLeast(totalResult, res.body.length)
    })

    it('should be able to handle different optional filter parameters', async () => {
      const resultCategories = ['Detected', 'Invalid', 'Error', 'Acknowledged', 'Processed']
      let res = await server
        .get(`${path}?size=${totalResults}&deviceType=CepheidGeneXpert&resultCategories=${resultCategories.join(',')}`)
        .set('Authorization', `Bearer ${shared.token}`)
        .set('api-version', `2`)
      await Promise.delay(500)
      assertReporterResultDownloadResponseContainingResults(res, totalResults)

      res = await server
        .get(
          `${path}?size=${totalResults}&deviceType=CepheidGeneXpert&assayExternalIds=GxMtbRif,GxMtbRifUltra,GxMtbXdr`
        )
        .set('Authorization', `Bearer ${shared.token}`)
        .set('api-version', `2`)
      await Promise.delay(500)
      assertReporterResultDownloadResponseContainingResults(res, totalResults)

      res = await server
        .get(`${path}?size=${totalResults}&deviceType=CepheidGeneXpert&workflowStatus=Deliverable`)
        .set('Authorization', `Bearer ${shared.token}`)
        .set('api-version', `2`)
      await Promise.delay(500)
      assertReporterResultDownloadResponseContainingNoResults(res)

      res = await server
        .get(`${path}?size=${totalResults}&patientSample=-&deviceType=CepheidGeneXpert`)
        .set('Authorization', `Bearer ${shared.token}`)
        .set('api-version', `2`)
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
        .set('api-version', `2`)
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
        .set('api-version', `2`)
      await Promise.delay(1000)
      assertReporterResultDownloadResponseContainingResults(res, 2)
      // check if the download is register in the table.
      const { count: totalResult } = await knex('ResultDownloadLog')
        .where('resultId', res.body.data[0].id)
        .count('id as count')
        .first()

      assert.equal(totalResult, 1)
    })

    it('should return testInfo for each test items', async () => {
      const res = await server
        .get(`${path}?size=${totalResults}&deviceType=CepheidGeneXpert`)
        .set('Authorization', `Bearer ${shared.token}`)
        .set('api-version', `31`)
      assertReporterResultDownloadResponseContainingTestInformation(res, totalResults, async () => {
        // check if the download is register in the table.
        const { count: totalResult } = await knex('ResultDownloadLog as rdl')
          .join('Result as r', 'rdl.resultId', 'r.id')
          .join('ResultWorkflowLog as rsl', 'r.resultWorkflowStatusLogId', 'rsl.id')
          .join('ResultWorkflowStatus as rs', 'rs.id', 'rsl.resultWorkflowStatusId')
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

    it('should return clinical response for each test items', async () => {
      const res = await server
        .get(`${path}?size=${totalResults}&deviceType=CepheidGeneXpert`)
        .set('Authorization', `Bearer ${shared.token}`)
        .set('api-version', `31`)
      assertReporterResultDownloadResponseContainingClinicalResponse(res, totalResults)
      // we're not awaiting the insert before returning in service.js, so need a delay here
      await Promise.delay(1000)

      // check if the download is register in the table.
      const { count: totalResult } = await knex('ResultDownloadLog as rdl')
        .join('Result as r', 'rdl.resultId', 'r.id')
        .join('ResultWorkflowLog as rsl', 'r.resultWorkflowStatusLogId', 'rsl.id')
        .join('ResultWorkflowStatus as rs', 'rs.id', 'rsl.resultWorkflowStatusId')
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
})

describe('Mobile API Result download routes v2 with higher version', () => {
  const path = '/mobile/api/results'

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

    // set all to deliverable
    const resultWorkflowStatusId = await resultWorkflowStatusToId('Deliverable')
    await knex('ResultWorkflowLog')
      .whereIn('resultId', _.map(results, 'id'))
      .update('resultWorkflowStatusId', resultWorkflowStatusId)

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
      assert.property(response.body, 'awaitingTreatment')
      assert.property(response.body, 'pages')
      assert.property(response.body, 'offset')
      if (!_.isNil(response.body.nextPage)) {
        assert.property(response.body, 'nextPage')
        assert.isAtLeast(response.body, 'hasNext')
      }
    }

    function assertReporterResultDownloadResponseContainingNoResults(response) {
      assertReporterResultDownloadResponse(response)
      assert.isAtLeast(response.body.total, 0)
      assert.equal(response.body.length, 0)
      assert.isAtLeast(response.body.awaitingTreatment, 0)

      assert.typeOf(response.body.data, 'array')
      assert.equal(response.body.data.length, 0)
    }

    function assertReporterResultDownloadResponseContainingResults(response, numberOfResults) {
      assertReporterResultDownloadResponse(response)

      assert.equal(response.body.total, numberOfResults)
      assert.equal(response.body.length, numberOfResults)
      assert.isAtLeast(response.body.awaitingTreatment, 0)
      if (!_.isNil(response.body.nextPage)) {
        assert.isAtLeast(response.body.nextPage, 0)
      }
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

      assert.equal(Object.keys(response.body.data[0]).length, 28)
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
      assert.property(response.body.data[0], 'testId')
      assert.property(response.body.data[0], 'resultData')
      assert.property(response.body.data[0], 'sample')
      assert.property(response.body.data[0], 'comments')
      assert.property(response.body.data[0], 'followUps')
      assert.property(response.body.data[0], 'assayAvatar')
      assert.property(response.body.data[0], 'testInformation')
      assert.property(response.body.data[0], 'clinicalResponse')
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

    function assertReporterResultDownloadResponseContainingResultsWithAssayAvatar(response, numberOfResults) {
      assertReporterResultDownloadResponse(response)

      assert.equal(response.body.total, numberOfResults)
      assert.equal(response.body.length, numberOfResults)
      assert.isAtLeast(response.body.awaitingTreatment, 0)
      if (!_.isNil(response.body.nextPage)) {
        assert.isAtLeast(response.body.nextPage, 0)
      }
      expect(response).to.containSubset({
        body: {
          data: [
            {
              assayAvatar: {
                contentI18nKey: 'assayTypeMtbRif',
                contentText: 'TB',
                backgroundColour: 'purple',
                foregroundColour: 'secondary',
                contentIcon: null,
              },
            },
          ],
        },
      })

      assert.equal(Object.keys(response.body.data[0]).length, 28)
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
      assert.property(response.body.data[0], 'testId')
      assert.property(response.body.data[0], 'resultData')
      assert.property(response.body.data[0], 'sample')
      assert.property(response.body.data[0], 'comments')
      assert.property(response.body.data[0], 'followUps')
      assert.property(response.body.data[0], 'assayAvatar')
      assert.property(response.body.data[0], 'testInformation')
      assert.property(response.body.data[0], 'clinicalResponse')
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

    it('should return a paged list of results and update them to delivered with assayAvatar purple', async () => {
      const res = await server
        .get(`${path}?size=${totalResults}&deviceType=CepheidGeneXpert`)
        .set('Authorization', `Bearer ${shared.token}`)
        .set('api-version', `31`)
      assertReporterResultDownloadResponseContainingResultsWithAssayAvatar(res, totalResults)

      // we're not awaiting the insert before returning in service.js, so need a delay here
      await Promise.delay(1000)

      // check if the download is register in the table.
      const { count: totalResult } = await knex('ResultDownloadLog as rdl')
        .join('Result as r', 'rdl.resultId', 'r.id')
        .join('ResultWorkflowLog as rsl', 'r.resultWorkflowStatusLogId', 'rsl.id')
        .join('ResultWorkflowStatus as rs', 'rs.id', 'rsl.resultWorkflowStatusId')
        .whereIn(
          'rdl.resultId',
          _.map(res.body.data, elem => elem.id)
        )
        .where('rs.externalId', 'Delivered')
        .count('rdl.id as count')
        .first()

      assert.isAtLeast(totalResult, res.body.length)
    })

    it('should return a paged list of results and update them to delivered', async () => {
      const res = await server
        .get(`${path}?size=${totalResults}&deviceType=CepheidGeneXpert`)
        .set('Authorization', `Bearer ${shared.token}`)
        .set('api-version', `31`)
      assertReporterResultDownloadResponseContainingResults(res, totalResults)

      // we're not awaiting the insert before returning in service.js, so need a delay here
      await Promise.delay(1000)

      // check if the download is register in the table.
      const { count: totalResult } = await knex('ResultDownloadLog as rdl')
        .join('Result as r', 'rdl.resultId', 'r.id')
        .join('ResultWorkflowLog as rsl', 'r.resultWorkflowStatusLogId', 'rsl.id')
        .join('ResultWorkflowStatus as rs', 'rs.id', 'rsl.resultWorkflowStatusId')
        .whereIn(
          'rdl.resultId',
          _.map(res.body.data, elem => elem.id)
        )
        .where('rs.externalId', 'Delivered')
        .count('rdl.id as count')
        .first()

      assert.isAtLeast(totalResult, res.body.length)
    })

    it('should be able to handle different optional filter parameters', async () => {
      const resultCategories = ['Detected', 'Invalid', 'Error', 'Acknowledged', 'Processed']
      let res = await server
        .get(`${path}?size=${totalResults}&deviceType=CepheidGeneXpert&resultCategories=${resultCategories.join(',')}`)
        .set('Authorization', `Bearer ${shared.token}`)
        .set('api-version', `31`)
      await Promise.delay(500)
      assertReporterResultDownloadResponseContainingResults(res, totalResults)

      res = await server
        .get(
          `${path}?size=${totalResults}&deviceType=CepheidGeneXpert&assayExternalIds=GxMtbRif,GxMtbRifUltra,GxMtbXdr`
        )
        .set('Authorization', `Bearer ${shared.token}`)
        .set('api-version', `31`)
      await Promise.delay(500)
      assertReporterResultDownloadResponseContainingResults(res, totalResults)

      res = await server
        .get(`${path}?size=${totalResults}&deviceType=CepheidGeneXpert&workflowStatus=Deliverable`)
        .set('Authorization', `Bearer ${shared.token}`)
        .set('api-version', `31`)
      await Promise.delay(500)
      assertReporterResultDownloadResponseContainingNoResults(res)

      res = await server
        .get(`${path}?size=${totalResults}&patientSample=-&deviceType=CepheidGeneXpert`)
        .set('Authorization', `Bearer ${shared.token}`)
        .set('api-version', `31`)
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
        .set('api-version', `31`)
      await Promise.delay(1000)
      assertReporterResultDownloadResponseContainingResults(res, totalResults)
    })

    it('should return a paged list of results with the higher api endpoint available version, including all result details, that the clinician has access to', async () => {
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
        .set('api-version', `31`)
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

describe('Mobile API Result download by id routes v2', () => {
  const path = '/mobile/api/results'

  // const clinicianAccessToken = ''
  let results = []
  const resultId = 171

  before(async () => {
    shared.checkToken(server, path)
    // clinicianAccessToken = await getClinicianAccessToken()
  })

  beforeEach(async () => {
    const { partnerId, userId } = await knex('Person as p')
      .innerJoin('User as u')
      .where('u.name', 'admin')
      .first('p.lastPartnerId as partnerId', 'p.id as personId', 'p.userId')

    results = await generateResults(knex, userId, partnerId, patients, [], 'US', false, 30, 0, 0, 0)

    await setTreatmentStatusToResults(knex, results, ['OnTreatment'])

    // set all to deliverable
    const resultWorkflowStatusId = await resultWorkflowStatusToId('Deliverable')
    await knex('ResultWorkflowLog')
      .whereIn('resultId', _.map(results, 'id'))
      .update('resultWorkflowStatusId', resultWorkflowStatusId)

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
          data: {},
        },
      })
      assert.property(response.body, 'data')
    }

    function assertReporterResultDownloadRequestValidResultId(response) {
      assertReporterResultDownloadResponse(response)

      assert.equal(Object.keys(response.body.data).length, 28)
      assert.property(response.body.data, 'id')
      assert.property(response.body.data, 'externalId')
      assert.property(response.body.data, 'endedOn')
      assert.property(response.body.data, 'updatedOn')
      assert.property(response.body.data, 'assayExternalId')
      assert.property(response.body.data, 'siteName')
      assert.property(response.body.data, 'reportableSiteId')
      assert.property(response.body.data, 'sampleOriginSiteId')
      assert.property(response.body.data, 'firstViewedOn')
      assert.property(response.body.data, 'deviceName')
      assert.property(response.body.data, 'resultCategory1ExternalId')
      assert.property(response.body.data, 'resultCategory2ExternalId')
      assert.property(response.body.data, 'workflowStatus')
      assert.property(response.body.data, 'treatmentStatus')
      assert.property(response.body.data, 'patientData')
      assert.property(response.body.data, 'testId')
      assert.property(response.body.data, 'resultData')
      assert.property(response.body.data, 'sample')
      assert.property(response.body.data, 'comments')
      assert.property(response.body.data, 'followUps')
      assert.property(response.body.data, 'assayAvatar')
      assert.property(response.body.data, 'testInformation')
      assert.property(response.body.data, 'clinicalResponse')
      if (response.body.data.followUps) {
        assert.typeOf(response.body.data.followUps, 'array')
        assert.property(response.body.data.followUps[0], 'id')
        assert.property(response.body.data.followUps[0], 'externalId')
        assert.property(response.body.data.followUps[0], 'followUpTypeExternalId')
        assert.property(response.body.data.followUps[0], 'followUpExternalId')
        assert.property(response.body.data.followUps[0], 'followUpi18nKey')
        assert.property(response.body.data.followUps[0], 'followUpName')
        assert.property(response.body.data.followUps[0], 'followUpTypei18nKey')
        assert.property(response.body.data.followUps[0], 'followUpTypeName')
        assert.property(response.body.data.followUps[0], 'date')
        assert.property(response.body.data.followUps[0], 'createdOn')
        assert.property(response.body.data.followUps[0], 'updatedOn')
      }
    }

    it('should return a result object for valid result ID', async () => {
      const res = await server
        .get(`${path}/${results[0].id}`)
        .set('Authorization', `Bearer ${shared.token}`)
        .set('api-version', `2`)
      assertReporterResultDownloadRequestValidResultId(res)
    })

    it('Result ID not found', async () => {
      const res = await server
        .get(`${path}/${resultId}`)
        .set('Authorization', `Bearer ${shared.token}`)
        .set('api-version', `2`)
      assert.equal(res.status, 404)
    })

    it('Result ID is non numeric, it shoud throw result not found', async () => {
      const res = await server
        .get(`${path}/testResId`)
        .set('Authorization', `Bearer ${shared.token}`)
        .set('api-version', `2`)
      assert.equal(res.status, 404)
    })
  })
})
