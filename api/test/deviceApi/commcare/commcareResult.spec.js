const supertest = require('supertest')
const chai = require('chai')
const { getCommCarePayload } = require('./commcare_utils')
const {
  createTestContext,
  getDeviceFromApiKey,
  getLastResult,
} = require('../utils')

const server = supertest.agent('http://localhost:8080')
const { assert } = chai

const pluginPath = '/device/plugin/commcare'

describe('CommCare Result API routes', () => {
  describe('admin result updates', () => {
    const context = createTestContext(server, {
      user: 'gates_rdt',
      password: 'gates2018',
      type: 'CommCareApp',
      partner: 'GatesRDT',
      site: 'commcare',
    })

    const { runTest } = context

    beforeEach(context.beforeEach)
    afterEach(context.afterEach)

    it('should add and return device results', () =>
      runTest(async knex => {
        const { apiKey } = context

        let payload = getCommCarePayload('negative', {
          age: 28,
          gender: 'male',
        })
        await server
          .post(pluginPath)
          .auth('commcare_test', apiKey.token)
          .send(payload)
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
          })
        const { id: deviceId } = await getDeviceFromApiKey(knex, apiKey)

        let result = await getLastResult(knex, deviceId)
        assert.equal(result.data.resultText, 'negative')
        assert.equal(result.patient.gender, 'male')
        assert.equal(result.patient.age, 28)

        payload = getCommCarePayload('positive', {
          age: 43,
          gender: 'female',
        })
        await server
          .post(pluginPath)
          .auth('commcare_test', apiKey.token)
          .send(payload)
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
          })

        result = await getLastResult(knex, deviceId)
        assert.equal(result.data.resultText, 'positive')
        assert.equal(result.patient.gender, 'female')
        assert.equal(result.patient.age, 43)
      }))
  })
})
