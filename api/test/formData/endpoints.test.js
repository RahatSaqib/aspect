const proxyquire = require('proxyquire')
const { assert } = require('chai')
const _ = require('lodash')
const endpointUtils = require('../utils/endpointUtils')

describe('formData endpoints', () => {
  function setupRoute(method, path, useCaseStubs = {}) {
    const endpoints = proxyquire('../../src/formData/endpoints', {
      './listFormDataEntries': { listFormDataEntries: async () => {}, ...useCaseStubs.list },
      './showFormDataEntry': { showFormDataEntry: async () => {}, ...useCaseStubs.show },
    })

    return _.find(endpoints.routes, { method, path })
  }

  it('should expose GET /form-data and wire it to listFormDataEntries', done => {
    const expectedResponse = { ok: true, total: 0, length: 0, data: [] }
    const endpoint = setupRoute('GET', '/form-data', {
      list: { listFormDataEntries: async () => expectedResponse },
    })

    assert.equal(endpoint.config.auth.scope[0], 'forms:view')

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
      show: { showFormDataEntry: async () => expectedResponse },
    })

    assert.equal(endpoint.config.auth.scope[0], 'forms:view')

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
