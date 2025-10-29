const chai = require('chai')
const _ = require('lodash')
const { addHours, format: dateFormat } = require('date-fns')

const Promise = require('bluebird')
const shared = require('../utils/sharedToken')
const { assayToId, resultCategoryToId } = require('../../src/shared/dictionary')
const { knex } = require('../../src/db')

const server = require('../utils/testUtils')

const { assert } = chai

describe('Result create and update routes', () => {
  let resultId = null
  let firstResultCase = {}
  const resultIds = []
  const path = '/api/result'
  const now = new Date(dateFormat(new Date(), "yyyy-MM-dd HH:mm:ss.000'Z'"))
  const resultFieldNames = [
    'id',
    'endedOn',
    'deviceId',
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
    'siteId',
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
    'resultTreatmentMethod',
    'resultTreatmentData',
    'resultNotes',
  ]

  before(async function () {
    this.timeout(120000)
    shared.checkToken(server, path)
  })

  after(async () => {
    if (!_.isEmpty(resultIds)) {
      await knex('ResultTreatmentStatusLog').whereIn('resultId', resultIds).del()

      await knex('PatientCase')
        .whereIn('id', await knex('Result').whereIn('id', resultIds).pluck('patientCaseId'))
        .del()

      await knex('ResultTag').whereIn('resultId', resultIds).del()

      await knex('Result').whereIn('id', resultIds).del()

      await knex('Sample').whereIn('id', resultIds).del()
    }
    return Promise.resolve()
  })

  describe('POST', () => {
    it('Should create a new result', async () => {
      const resultPayload = {
        siteId: 1,
        deviceId: 2,
        assayId: await assayToId('DaktariHivVL'),
        startedOn: now,
        endedOn: addHours(now, 2),
        sampleId: 'A-SAMPLE-ID',
        sampleTypeId: 1,
        sampleCollectedOn: now,
        sampleOriginSiteId: 1,
        caseExternalId: 'A-CASE-ID',
        resultCategory1: await resultCategoryToId('Detected'),
        resultCategory2: await resultCategoryToId('Detected'),
        tags: 'tag 1,tag 2',
        formData: { field1: 'value1' },
      }

      // update with external ID
      const res = await server.post(path).send(resultPayload).set('Authorization', `Bearer${shared.token}`)

      assert.equal(res.status, 200)
      resultId = res.body.data.id
      assert.typeOf(res.body, 'Object')
      assert.property(res.body, 'data')
      assert.typeOf(res.body.data, 'Object')

      // check that all field names we expect are present. if we the field was part of the post, make sure it's set to the posted value
      _.each(resultFieldNames, fieldName => {
        assert.property(res.body.data, fieldName)
        if (resultPayload[fieldName] && fieldName !== 'endedOn') {
          assert.equal(res.body.data[fieldName], resultPayload[fieldName])
        }
      })

      // check that case created and assigned
      firstResultCase = await knex('PatientCase').where({ externalId: resultPayload.caseExternalId }).first()
      const { patientCaseId: resultCaseId } = await knex('Result').where({ id: resultId }).first('patientCaseId')
      assert.equal(firstResultCase.externalId, resultPayload.caseExternalId)
      assert.equal(resultCaseId, firstResultCase.id)

      // check tags
      const tags = await knex('Tag as t')
        .join('ResultTag as rt', 't.id', 'rt.tagId')
        .where('rt.resultId', resultId)
        .select('title')

      assert.deepEqual(resultPayload.tags.split(',').sort(), tags.map(t => t.title).sort())

      // check assay was set correctly
      assert.equal(res.body.data.assay.externalId, 'DaktariHivVL')
      assert.closeTo(new Date(res.body.data.updatedOn).getTime(), new Date().getTime(), 5000)

      // remember for deletion
      resultIds.push(resultId)
    })

    it('Should throw internal exception if no device ID posted.', async () => {
      const resultPayload = {
        siteId: 1,
        assayId: await assayToId('DaktariHivVL'),
        startedOn: now,
        endedOn: addHours(now, 2),
        sampleId: 'A-SAMPLE-ID',
        sampleTypeId: 1,
        sampleCollectedOn: now,
        sampleOriginSiteId: 1,
        caseExternalId: 'A-CASE-ID',
        resultCategory1: await resultCategoryToId('Detected'),
        resultCategory2: await resultCategoryToId('NotDetected'),
      }

      // update with external ID
      const res = await server.post(path).send(resultPayload).set('Authorization', `Bearer${shared.token}`)

      assert.equal(res.status, 500)
    })

    it('Should be assigned to the same case as an older result if posted with the same case id', async () => {
      const resultPayload = {
        siteId: 1,
        deviceId: 2,
        assayId: await assayToId('DaktariHivVL'),
        startedOn: now,
        endedOn: addHours(now, 2),
        sampleId: 'A-SAMPLE-ID',
        sampleTypeId: 1,
        sampleCollectedOn: now,
        sampleOriginSiteId: 1,
        caseExternalId: 'A-CASE-ID',
        resultCategory1: await resultCategoryToId('Error'),
      }

      // update with external ID
      const res = await server.post(path).send(resultPayload).set('Authorization', `Bearer${shared.token}`)

      assert.equal(res.status, 200)
      resultId = res.body.data.id

      // check that assigned to same case
      const { patientCaseId: resultCaseId } = await knex('Result').where({ id: resultId }).first('patientCaseId')
      assert.equal(firstResultCase.id, resultCaseId)

      // remember for deletion
      resultIds.push(resultId)
    })

    it('Should be assigned to a different case if a new case ID was posted', async () => {
      const resultPayload = {
        siteId: 1,
        deviceId: 2,
        assayId: await assayToId('DaktariHivVL'),
        startedOn: now,
        endedOn: addHours(now, 2),
        sampleId: 'A-SAMPLE-ID',
        sampleTypeId: 1,
        sampleCollectedOn: now,
        sampleOriginSiteId: 1,
        caseExternalId: 'A-NEW-CASE-ID',
        resultCategory1: await resultCategoryToId('Detected'),
        resultCategory2: await resultCategoryToId('NotDetected'),
      }

      // update with external ID
      const res = await server.post(path).send(resultPayload).set('Authorization', `Bearer${shared.token}`)

      assert.equal(res.status, 200)
      resultId = res.body.data.id

      // check that assigned to new case
      const { patientCaseId: resultCaseId } = await knex('Result').where({ id: resultId }).first('patientCaseId')
      assert.notEqual(firstResultCase.id, resultCaseId)

      // remember for deletion
      resultIds.push(resultId)
    })
  })
})
