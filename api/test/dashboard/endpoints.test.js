const proxyquire = require('proxyquire')
const { assert } = require('chai')
const _ = require('lodash')
const endpointUtils = require('../utils/endpointUtils')

describe('dashboard endpoint', () => {
  function setupRoute(method, path, serviceStub) {
    const endpoints = proxyquire('../../src/dashboard/endpoints', {
      './service': serviceStub,
    })
    return _.find(endpoints, { method, path })
  }

  describe('/dashboard/summary', () => {
    let endpoint
    const expectedResponse = { value: 'Expected result' }

    beforeEach(() => {
      endpoint = setupRoute('GET', '/dashboard/summary', {
        *summaryDashboard() {
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
