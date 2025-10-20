const chai = require('chai')
const shared = require('../utils/sharedToken')
const { knex } = require('../../src/db')

const server = require('../utils/testUtils')

const { assert } = chai

describe('Result routes', () => {
  const path = '/api/result'

  describe('GET', () => {
    before(() => shared.checkToken(server, path))

    it('should return a list of results for the specific patient id', async () => {
      const result = await knex('Result').first('*')
      const patientData = JSON.parse(result.patientData)
      const res = await server
        .get(`${path}/patientresultsdetails?patientId=${patientData.id}`)
        .set('Authorization', `Bearer ${shared.token}`)

      assert.equal(res.status, 200)
      assert.typeOf(res.body, 'Object')
      assert.property(res.body, 'data')
      assert.typeOf(res.body.data, 'array')
      assert.isAtLeast(res.body.data.length, 1)
      assert.property(res.body.data[0], 'resultId')
      assert.property(res.body.data[0], 'sampleCollectedOn')
      assert.property(res.body.data[0], 'originalSiteName')
      assert.property(res.body.data[0], 'sampleId')
      assert.property(res.body.data[0], 'resultEndedOn')
      assert.property(res.body.data[0], 'assayAbbreviation')
      assert.property(res.body.data[0], 'assayId')
      assert.property(res.body.data[0], 'resultData')
      assert.property(res.body.data[0], 'resultSiteName')
      assert.property(res.body.data[0], 'resultNotes')
      assert.property(res.body.data[0], 'resultTreatmentStatusLogDate')
      assert.property(res.body.data[0], 'resultTreatmentId')
      assert.property(res.body.data[0], 'patientData')
      assert.property(res.body.data[0], 'type')
      assert.property(res.body.data[0], 'sampleType')
      assert.property(res.body.data[0], 'date')
      assert.property(res.body.data[0], 'resultTreatmentName')
      assert.property(res.body.data[0], 'patientDataSchema')
    })
    it('it should return a 404 for the specific patient id', async () => {
      const res = await server
        .get(`${path}/patientresultsdetails?patientId=1111111`)
        .set('Authorization', `Bearer ${shared.token}`)

      assert.equal(res.status, 404)
    })
  })
})
