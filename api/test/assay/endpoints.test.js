const proxyquire = require('proxyquire')
const { assert } = require('chai')
const _ = require('lodash')
const endpointUtils = require('../utils/endpointUtils')

describe('assay endpoint', () => {
  function setupRoute(method, path, serviceStub) {
    const endpoints = proxyquire('../../src/assay/endpoints', {
      './service': serviceStub,
    })
    return _.find(endpoints.routes, { method, path })
  }

  describe('/assay', () => {
    let endpoint
    const expectedResponse = { value: 'Expected Assay' }

    beforeEach(() => {
      endpoint = setupRoute('GET', '/assay', {
        async listAssays() {
          return expectedResponse
        },
      })
    })
    it('Should respond with the data returned from the service', done => {
      endpointUtils
        .callHandlerOn(endpoint)
        .handleResponseWith(response => {
          assert.deepEqual(response, expectedResponse)
        })
        .thenCall(done)
        .execute()
    })
  })
})
