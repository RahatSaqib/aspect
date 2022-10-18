const chai = require('chai')
const { getCommCarePayload } = require('./commcare_utils')
const { createTestContext, getDeviceFromApiKey, getLastResult } = require('../utils')

const server = require('../../utils/testUtils')

const { assert } = chai
const { knex } = require('../../../src/db')

const pluginPath = '/device/plugin/commcare'

describe.skip('CommCare Result API routes', () => {
  describe('Check patient phone normalization malawi', () => {
    const context = createTestContext(knex, server, {
      user: 'reporter_admin',
      password: 'test07',
      type: 'CommCareApp',
      partner: 'Reporter',
      site: 'commcare3',
    })

    before(async () => {
      await context.createSites(['commcare3'])
      await context.createDeviceWithApiKey()
    })
    afterEach(context.afterEach)
    it('should add and return device results with normalized malawi phone', async () => {
      const { apiKey } = context

      const payload = getCommCarePayload({
        id: '9999',
        resultText: 'positive',
        hcwResult: 'positive',
        age: 28,
        gender: 'male',
      })
      payload.form.phone_number = '123 456-78'
      await server
        .post(pluginPath)
        .auth('commcare_test', apiKey.token)
        .send(payload)
        .then(res => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
        })
      const { id: deviceId } = await getDeviceFromApiKey(knex, apiKey)

      const result = await getLastResult(knex, deviceId)
      assert.equal(result.id, '9999')
      assert.equal(result.data.resultText, 'positive')
      assert.equal(result.data.hcwConfirmatoryResult, 'positive')
      assert.equal(result.patient.gender, 'male')
      assert.equal(result.patient.phone, '+26512345678')
    })
  })
  describe('check patient phone normalization after payload transformation myanmar', () => {
    const context = createTestContext(knex, server, {
      user: 'myanmar_admin',
      password: 'test07',
      type: 'CommCareApp',
      partner: 'Myanmar',
      site: 'commcare2',
    })

    before(async () => {
      await context.createSites(['commcare2'])
      await context.createDeviceWithApiKey()
    })
    afterEach(context.afterEach)
    it('should add and return device results with a normalized myanmar phone', async () => {
      const { apiKey } = context

      const payload = getCommCarePayload({
        id: '9991',
        resultText: 'positive',
        hcwResult: 'positive',
        age: 28,
        gender: 'male',
      })
      payload.form.phone_number = '123 456-78'
      await server
        .post(pluginPath)
        .auth('commcare_test', apiKey.token)
        .send(payload)
        .then(res => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
        })
      const { id: deviceId } = await getDeviceFromApiKey(knex, apiKey)

      const result = await getLastResult(knex, deviceId)
      assert.equal(result.id, '9991')
      assert.equal(result.data.resultText, 'positive')
      assert.equal(result.data.hcwConfirmatoryResult, 'positive')
      assert.equal(result.patient.gender, 'male')
      assert.equal(result.patient.phone, '+9512345678')
    })
  })
  describe('admin result updates', () => {
    const context = createTestContext(knex, server, {
      user: 'gates_rdt',
      password: 'gates2018',
      type: 'CommCareApp',
      partner: 'GatesRDT',
      site: 'commcare',
    })

    before(async () => {
      await context.createSites(['commcare'])
      await context.createDeviceApiKey()
    })
    afterEach(context.afterEach)

    it('should add and return device results', async () => {
      const { apiKey } = context

      let payload = getCommCarePayload({
        id: '123',
        resultText: 'negative',
        hcwResult: 'negative',
        age: 28,
        gender: 'male',
      })
      const res = await server.post(pluginPath).auth('commcare_test', apiKey.token).send(payload)
      assert.equal(res.status, 200)
      assert.typeOf(res.body, 'Object')

      const { id: deviceId } = await getDeviceFromApiKey(knex, apiKey)

      let result = await getLastResult(knex, deviceId)
      assert.equal(result.id, '123')
      assert.equal(result.data.resultText, 'negative')
      assert.equal(result.data.hcwConfirmatoryResult, 'negative')
      assert.equal(result.patient.gender, 'male')
      assert.equal(result.patient.age, 28)

      payload = getCommCarePayload({
        id: '456',
        resultText: 'negative',
        hcwResult: 'positive',
        age: 43,
        gender: 'female',
      })
      payload.form.phone_number = '12345678'
      const res2 = await server.post(pluginPath).auth('commcare_test', apiKey.token).send(payload)

      assert.equal(res2.status, 200)
      assert.typeOf(res2.body, 'Object')

      result = await getLastResult(knex, deviceId)
      assert.equal(result.id, '456')
      assert.equal(result.data.resultText, 'negative')
      assert.equal(result.data.hcwConfirmatoryResult, 'positive')
      assert.equal(result.patient.gender, 'female')
      assert.equal(result.patient.phone, '+112345678')
      assert.equal(result.patient.age, 43)

      payload = getCommCarePayload({
        id: '821',
        resultText: 'negative',
        hcwResult: 'positive',
        hcwTiebreakResult: 'negative',
        age: 30,
        gender: 'male',
      })
      const res3 = await server.post(pluginPath).auth('commcare_test', apiKey.token).send(payload)

      assert.equal(res3.status, 200)
      assert.typeOf(res3.body, 'Object')

      result = await getLastResult(knex, deviceId)
      assert.equal(result.id, '821')
      assert.equal(result.data.resultText, 'negative')
      assert.equal(result.data.hcwConfirmatoryResult, 'positive')
      assert.equal(result.data.hcwTiebreakerResult, 'negative')
      assert.equal(result.patient.gender, 'male')
      assert.equal(result.patient.age, 30)
    })
  })
})
