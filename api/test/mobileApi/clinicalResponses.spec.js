const chai = require('chai')
const _ = require('lodash')
const shared = require('../utils/sharedToken')

const { generateResults, setTreatmentStatusToResults } = require('../../seeds/commonGenerateResults')
const patients = require('../../seeds/test/fixtures/patients.json')

const { knex } = require('../../src/db')

const { resultCategoryToId, resultWorkflowStatusToId } = require('../../src/shared/dictionary')

const server = require('../utils/testUtils')
const { getBaseQueryForResults } = require('../../src/result/common/db')

const { assert, expect } = chai

describe('Mobile API Clinical Response', () => {
  const path = '/mobile/api/results/clinical-responses'

  let results = []

  before(async () => {
    shared.checkToken(server, path)
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

  describe('POST', () => {
    function assertClinicalResponse(response) {
      expect(response).to.containSubset({
        status: 200,
        body: {
          ok: true,
          data: {},
        },
      })
      assert.property(response.body, 'data')
    }

    function assertResponseContainingClinicalResponse(response) {
      assertClinicalResponse(response)
      expect(response).to.containSubset({
        body: {
          data: {
            clinicalResponse: {},
          },
        },
      })

      if (response.body.data.clinicalResponse) {
        assert.property(response.body.data.clinicalResponse, 'recorded')
        if (response.body.data.clinicalResponse.recorded) {
          assert.property(response.body.data.clinicalResponse, 'confirmedOn')
          assert.equal(Object.keys(response.body.data.clinicalResponse).length, 6)
        }
        assert.property(response.body.data.clinicalResponse, 'treatment')
        assert.property(response.body.data.clinicalResponse, 'treatmentStarted')
        assert.property(response.body.data.clinicalResponse, 'outcome')
        assert.property(response.body.data.clinicalResponse, 'outcomeOccurred')
        assert.equal(Object.keys(response.body.data.clinicalResponse).length, 5)
      }
    }

    function responseContainingNulllOutcomeClinicalResponse(response) {
      assertClinicalResponse(response)
      expect(response).to.containSubset({
        body: {
          data: {
            clinicalResponse: {},
          },
        },
      })

      if (response.body.data.clinicalResponse) {
        assert.equal(response.body.data.clinicalResponse.outcome, null)
        assert.equal(response.body.data.clinicalResponse.outcomeOccurred, null)
      }
    }

    it('it should add clinical response', async () => {
      const res = await server
        .post(`${path}/${results[0].id}`)
        .send([
          {
            fieldName: 'confirmed',
            value: true,
            clientTime: '2022-12-04T11:50:01.011Z',
          },
          {
            fieldName: 'treatment',
            value: 'iaac',
            clientTime: new Date().toISOString(),
          },
          {
            fieldName: 'outcome',
            value: 'notRecovered',
            clientTime: new Date().toISOString(),
          },
          {
            fieldName: 'outcomeOccurred',
            value: '2022-01-24',
            clientTime: '2022-12-03T15:04:12.424Z',
          },
        ])
        .set('Authorization', `Bearer ${shared.token}`)
      assertResponseContainingClinicalResponse(res)
    })

    it('it should remove all followups for outcome in case of latest outcome value is null', async () => {
      const res = await server
        .post(`${path}/${results[0].id}`)
        .send([
          {
            fieldName: 'confirmed',
            value: true,
            clientTime: '2022-12-04T11:50:01.011Z',
          },
          {
            fieldName: 'treatment',
            value: 'iaac',
            clientTime: new Date().toISOString(),
          },
          {
            fieldName: 'outcome',
            value: null,
            clientTime: new Date().toISOString(),
          },
          {
            fieldName: 'outcomeOccurred',
            value: '2022-01-24',
            clientTime: '2022-12-03T15:04:12.424Z',
          },
        ])
        .set('Authorization', `Bearer ${shared.token}`)
      responseContainingNulllOutcomeClinicalResponse(res)
    })
  })
})
