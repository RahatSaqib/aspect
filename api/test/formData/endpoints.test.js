const proxyquire = require('proxyquire')
const { assert } = require('chai')
const _ = require('lodash')
const endpointUtils = require('../utils/endpointUtils')

describe('formData endpoints', () => {
  function setupRoute(method, path, serviceStub = {}) {
    const endpoints = proxyquire('../../src/formData/endpoints', {
      './service': serviceStub,
    })

    return _.find(endpoints.routes, { method, path })
  }

  it('should expose GET /form-data and wire it to listFormDataEntries', done => {
    const expectedResponse = { ok: true, total: 0, length: 0, data: [] }
    const endpoint = setupRoute('GET', '/form-data', {
      listFormDataEntries: async () => expectedResponse,
    })

    assert.equal(endpoint.config.auth.scope[0], 'result:view')

    endpointUtils
      .callHandlerOn(endpoint)
      .with({ query: {}, auth: { credentials: {} } })
      .handleResponseWith(response => {
        assert.deepEqual(response, expectedResponse)
      })
      .thenCall(done)
      .execute()
  })

  it('should expose GET /form-data/{id} and wire it to showFormDataEntry', done => {
    const expectedResponse = { ok: true, data: { id: 5 } }
    const endpoint = setupRoute('GET', '/form-data/{id}', {
      showFormDataEntry: async () => expectedResponse,
    })

    assert.equal(endpoint.config.auth.scope[0], 'result:view')

    endpointUtils
      .callHandlerOn(endpoint)
      .with({ params: { id: 5 }, auth: { credentials: {} } })
      .handleResponseWith(response => {
        assert.deepEqual(response, expectedResponse)
      })
      .thenCall(done)
      .execute()
  })
})
