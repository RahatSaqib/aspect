const proxyquire = require('proxyquire')
const { assert } = require('chai')
const _ = require('lodash')
const endpointUtils = require('../utils/endpointUtils')

describe('result endpoints', () => {
  function setupRoute(method, path, serviceStub) {
    const endpoints = proxyquire('../../src/mobileApi/result/endpoints', {
      './service': serviceStub,
    })
    return _.find(endpoints.routes, { method, path })
  }
  describe('/v1/result/download', () => {
    let endpoint
    const expectedResponse = { value: 'Expected result' }

    beforeEach(() => {
      endpoint = setupRoute('GET', '/v1/result/download', {
        async downloadResultsList() {
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

  describe('/v2/result/download', () => {
    let endpoint
    const expectedResponse = { value: 'Expected result' }

    beforeEach(() => {
      endpoint = setupRoute('GET', '/v2/result/download', {
        async downloadResultsListV2() {
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
