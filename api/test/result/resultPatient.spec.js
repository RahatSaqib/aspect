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
            /*                  assert.property(res.body.data[0], 'id')
                  assert.property(res.body.data[0], 'endedOn')
                  assert.property(res.body.data[0], 'deviceName')
                  assert.property(res.body.data[0], 'sampleOriginSiteName')
                  assert.property(res.body.data[0], 'countryName')
                  assert.property(res.body.data[0], 'stateName')
                  assert.property(res.body.data[0], 'lgaName')
                  assert.property(res.body.data[0], 'sampleId')
                  assert.property(res.body.data[0], 'sampleGroup')
                  assert.property(res.body.data[0], 'sampleOriginSiteName')
                  assert.property(res.body.data[0], 'resultText')
                  assert.property(res.body.data[0], 'resultWorkflowStatus')
                  assert.property(res.body.data[0], 'patientId')
                  assert.property(res.body.data[0], 'assayName') */
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
