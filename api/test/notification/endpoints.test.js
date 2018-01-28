const proxyquire = require('proxyquire')
const { assert } = require('chai')
const _ = require('lodash')
const endpointUtils = require('../utils/endpointUtils')

describe('notification endpoints', () => {
  function setupRoute(method, path, serviceStub) {
    const endpoints = proxyquire('../../src/notification/endpoints', {
      './service': serviceStub,
    })
    return _.find(endpoints, { method, path })
  }

  describe('GET', () => {
    describe('/notification', () => {
      let endpoint
      const expectedResponse = { value: 'Expected result' }

      beforeEach(() => {
        endpoint = setupRoute('GET', '/notification', {
          async listNotifications() {
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
})
