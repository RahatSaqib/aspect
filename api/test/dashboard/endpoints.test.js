const proxyquire = require('proxyquire')
const { assert } = require('chai')
const _ = require('lodash')
const endpointUtils = require('../utils/endpointUtils')

describe.only('dashboard endpoint', () => {
  function setupRoute(method, path, serviceStub) {
    const endpoints = proxyquire('../../src/dashboard/endpoints', {
      './service': serviceStub,
    })
    return _.find(endpoints.routes, { method, path })
  }

  describe('/dashboard/summary', () => {
    let endpoint
    const expectedResponse = { value: 'Expected result' }

    beforeEach(() => {
      endpoint = setupRoute('GET', '/dashboard/summary', {
        async summaryDashboard() {
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

  describe('/dashboard/clinical-indicators', () => {
    function setupRoute(method, path, serviceStub) {
      const endpoints = proxyquire('../../src/dashboard/endpoints', {
        '../result/service': serviceStub,
      })
      return _.find(endpoints.routes, { method, path })
    }
    let endpoint
    const expectedResponse = { value: 'Expected result' }

    beforeEach(() => {
      endpoint = setupRoute('GET', '/dashboard/clinical-indicators', {
        async clinicalIndicatorsDashboard() {
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
