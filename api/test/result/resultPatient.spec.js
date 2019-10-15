const supertest = require('supertest')
const chai = require('chai')
const shared = require('../utils/sharedToken')
const { runTestWithKnex } = require('../utils/generatorFunctionUtils')

const server = supertest.agent('http://localhost:8080')
const { assert } = chai

describe('Result routes', () => {
  const path = '/api/result'

  describe('GET', () => {
    shared.checkToken(server, path)

    it('should return a list of results for the specific patient id', () =>
      runTestWithKnex(async knex => {
        const result = await knex('Result').first('*')
        const patientData = JSON.parse(result.patientData)

        await server
          .get(`${path}/patientresultsdetails?patientId=${patientData.id}`)
          .set('Authorization', `Bearer ${shared.token}`)
          .then(res => {
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
            assert.property(res.body.data[0], 'resultStatus')
            assert.property(res.body.data[0], 'resultStatusLog')
            assert.property(res.body.data[0], 'resultTreatmentStatusLogDate')
            assert.property(res.body.data[0], 'notes')
            assert.property(res.body.data[0], 'resultTreatmentStatusLogMethod')
            assert.property(
              res.body.data[0],
              'resultTreatmentStatusLogCreatedBy'
            )
            assert.property(res.body.data[0], 'resultTreatmentStatusLogNotes')
            assert.property(res.body.data[0], 'resultTreatmentStatusLogId')
            assert.property(res.body.data[0], 'resultTreatmentId')
            assert.property(res.body.data[0], 'patientData')
            assert.property(res.body.data[0], 'type')
            assert.property(res.body.data[0], 'sampleType')
            assert.property(res.body.data[0], 'date')
            assert.property(res.body.data[0], 'resultTreatmentName')
            assert.property(res.body.data[0], 'patientDataSchema')
          })
      }))

    it('it should return a 404 for the specific patient id', done => {
      server
        .get(`${path}/patientresultsdetails?patientId=1111111`)
        .set('Authorization', `Bearer ${shared.token}`)
        .end((_err, res) => {
          assert.equal(res.status, 404)
          done()
        })
    })
  })
})
