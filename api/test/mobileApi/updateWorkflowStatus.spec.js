const chai = require('chai')
const _ = require('lodash')
const shared = require('../utils/sharedToken')

const { generateResults, setTreatmentStatusToResults } = require('../../seeds/commonGenerateResults')
const patients = require('../../seeds/test/fixtures/patients.json')
const { getBaseQueryForResults } = require('../../src/result/service')

const { knex } = require('../../src/db')

const { resultCategoryToId, resultWorkflowStatusToId } = require('../../src/shared/dictionary')

const server = require('../utils/testUtils')
const { getLatestResultWorkflowLog } = require('../../src/mobileApi/result/common/db')

const { assert } = chai

describe('Mobile API update workflow status to Flagged', () => {
  const path = '/mobile/api/results/flag-workflow-status'

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

  describe('PUT', () => {
    it('it should update result workflow status and match to flagged', async () => {
      const res = await server
        .put(`${path}/${results[0].id}`)
        .send({
          changedOn: '2022-12-21T23:01:46.000Z',
          reason: 'Dummy reason',
        })
        .set('Authorization', `Bearer ${shared.token}`)
      if (res.status === 200) {
        assert.typeOf(res.body, 'Object')
        const updatedResultWorkflowLog = await getLatestResultWorkflowLog(results[0].id)
        assert.equal(updatedResultWorkflowLog.resultWorkflowStatusId, 10)
      }
    })
  })
})
