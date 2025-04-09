const chai = require('chai')
const _ = require('lodash')
const { format } = require('date-fns')
const shared = require('../../utils/sharedToken')

const { generateResults, setTreatmentStatusToResults } = require('../../../seeds/commonGenerateResults')
const patients = require('../../../seeds/test/fixtures/patients.json')
const { getBaseQueryForResults } = require('../../../src/result/common/db')

const { knex } = require('../../../src/db')
const { resultCategoryToId, resultWorkflowStatusToId } = require('../../../src/shared/dictionary')

const server = require('../../utils/testUtils')

const { assert, expect } = chai

describe('Mobile API Entries and Clinical Response Integration', () => {
  const entriesPath = '/mobile/api/entries'
  const clinicalResponsePath = '/mobile/api/results/clinical-responses'

  let results = []
  let initialEntries = []
  let assayId

  before(async () => {
    shared.checkToken(server, entriesPath)
    shared.checkToken(server, clinicalResponsePath)

    // Get the assay ID for GxMtbRifUltra
    const assay = await knex('Assay').where('externalId', 'GxMtbRifUltra').first('id')
    assert.isDefined(assay, 'Assay GxMtbRifUltra should exist')
    assayId = assay.id
  })

  beforeEach(async () => {
    const { partnerId, userId } = await knex('Person as p')
      .innerJoin('User as u')
      .where('u.name', 'admin')
      .first('p.lastPartnerId as partnerId', 'p.id as personId', 'p.userId')

    results = await generateResults(knex, userId, partnerId, patients, [], 'US', false, 30, 0, 0, 0)

    // Set result category to Detected and ensure it requires treatment
    const resultCategoryId = await resultCategoryToId('Detected')
    await knex('Result').whereIn('id', _.map(results, 'id')).update({
      resultCategory1: resultCategoryId,
      assayId,
    })

    // Set workflow status to Deliverable
    const resultWorkflowStatusId = await resultWorkflowStatusToId('Deliverable')
    await knex('ResultWorkflowLog')
      .whereIn('resultId', _.map(results, 'id'))
      .update('resultWorkflowStatusId', resultWorkflowStatusId)

    // Set treatment status to AwaitingTreatment
    await setTreatmentStatusToResults(knex, results, ['AwaitingTreatment'])
  })

  afterEach(async () => {
    await knex('ResultFollowUp').whereIn('resultId', _.map(results, 'id')).delete()
    await knex('ResultDownloadLog').whereIn('resultId', _.map(results, 'id')).delete()
    await knex('Result').whereIn('id', _.map(results, 'id')).delete()
  })

  describe('GET entries -> POST clinical response -> GET entries', () => {
    it('should get entries, record treatment, and verify entries updated', async () => {
      // First GET entries
      const initialRes = await server
        .get(`${entriesPath}?minUpdatedOn=${format(new Date(), 'yyyy-MM-dd')}`)
        .set('Authorization', `Bearer ${shared.token}`)
        .set('api-version', '4')

      assert.equal(initialRes.status, 200)
      assert.property(initialRes.body, 'data')
      assert.isArray(initialRes.body.data)
      initialEntries = initialRes.body.data

      // Find an entry with AwaitingTreatment status
      const entryToUpdate = initialEntries.find(
        entry => entry.treatmentStatus && entry.treatmentStatus.externalId === 'AwaitingTreatment'
      )
      assert.isDefined(entryToUpdate, 'Should find an entry with AwaitingTreatment status')

      // Get the result ID from the entry
      const resultId = entryToUpdate.id

      const dateNow = Date.now()

      const twoDayBefore = new Date(dateNow - 2 * 24 * 60 * 60 * 1000).toISOString()
      const oneDayBefore = new Date(dateNow - 1 * 24 * 60 * 60 * 1000).toISOString()
      const treatmentOccurredDate = new Date(dateNow - 60 * 60 * 1000).toISOString()
      const oneDayAfter = new Date(dateNow + 1 * 24 * 60 * 60 * 1000).toISOString()

      // POST clinical response to record treatment
      const clinicalResponseResponseOne = await server
        .post(`${clinicalResponsePath}/${resultId}`)
        .send([
          {
            clientTime: twoDayBefore,
            fieldName: 'confirmed',
            value: false,
          },
          {
            clientTime: oneDayBefore,
            fieldName: 'treatment',
            value: 'drtb-bbsr',
          },
          {
            clientTime: treatmentOccurredDate,
            fieldName: 'treatmentOccurred',
            value: treatmentOccurredDate,
          },
          {
            clientTime: oneDayAfter,
            fieldName: 'outcome',
            value: 'cured',
          },
        ])
        .set('Authorization', `Bearer ${shared.token}`)

      assert.equal(clinicalResponseResponseOne.status, 200)
      assert.property(clinicalResponseResponseOne.body, 'data')
      assert.property(clinicalResponseResponseOne.body.data, 'clinicalResponse')

      // GET entries again to verify update
      const finalResponseOne = await server
        .get(`${entriesPath}?minUpdatedOn=${format(new Date(), 'yyyy-MM-dd')}`)
        .set('Authorization', `Bearer ${shared.token}`)
        .set('api-version', '4')

      assert.equal(finalResponseOne.status, 200)
      assert.property(finalResponseOne.body, 'data')
      assert.isArray(finalResponseOne.body.data)

      // Find the updated entry
      const updatedEntryOne = finalResponseOne.body.data.find(entry => entry.id === resultId)
      assert.isDefined(updatedEntryOne, 'Should find the updated entry')
      assert.property(updatedEntryOne, 'treatmentStatus')
      assert.equal(
        updatedEntryOne.treatmentStatus.externalId,
        'OnTreatment',
        'Treatment status should be updated to OnTreatment'
      )
      const updatedOnOne = updatedEntryOne.history.find(({ type }) => type === 'Treatment').updatedOn
      console.log('updatedEntryOne.history ', updatedEntryOne.history)
      expect(Math.abs(new Date(updatedOnOne).getTime() - new Date(treatmentOccurredDate).getTime())).to.be.lessThan(
        1000
      )

      const clinicalResponseResponseTwo = await server
        .post(`${clinicalResponsePath}/${resultId}`)
        .send([
          {
            clientTime: twoDayBefore,
            fieldName: 'confirmed',
            value: false,
          },
          {
            clientTime: oneDayBefore,
            fieldName: 'treatment',
            value: 'drtb-bbsr',
          },
          {
            clientTime: oneDayAfter,
            fieldName: 'treatmentOccurred',
            value: oneDayAfter,
          },
          {
            clientTime: oneDayAfter,
            fieldName: 'outcome',
            value: 'cured',
          },
        ])
        .set('Authorization', `Bearer ${shared.token}`)

      assert.equal(clinicalResponseResponseTwo.status, 200)
      assert.property(clinicalResponseResponseTwo.body, 'data')
      assert.property(clinicalResponseResponseTwo.body.data, 'clinicalResponse')

      const finalResponseTwo = await server
        .get(`${entriesPath}?minUpdatedOn=${format(new Date(), 'yyyy-MM-dd')}`)
        .set('Authorization', `Bearer ${shared.token}`)
        .set('api-version', '4')

      assert.equal(finalResponseTwo.status, 200)
      assert.property(finalResponseTwo.body, 'data')
      assert.isArray(finalResponseTwo.body.data)

      const updatedEntryTwo = finalResponseTwo.body.data.find(entry => entry.id === resultId)
      assert.isDefined(updatedEntryTwo, 'Should find the updated entry')
      assert.property(updatedEntryTwo, 'treatmentStatus')
      assert.equal(
        updatedEntryTwo.treatmentStatus.externalId,
        'OnTreatment',
        'Treatment status should be updated to OnTreatment'
      )
      console.log('updatedEntryTwo.history ', updatedEntryTwo.history)
      const updatedOnTwo = updatedEntryTwo.history.find(({ type }) => type === 'Treatment').updatedOn

      expect(Math.abs(new Date(updatedOnTwo).getTime() - new Date(treatmentOccurredDate).getTime())).to.be.lessThan(
        1000
      )
    })
  })
})
