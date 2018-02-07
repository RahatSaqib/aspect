const proxyquire = require('proxyquire')
const { assert } = require('chai')
const _ = require('lodash')
const endpointUtils = require('../utils/endpointUtils')

describe('tag endpoints', () => {
  function setupRoute(method, path, serviceStub) {
    const endpoints = proxyquire('../../src/tag/endpoints', {
      './service': serviceStub,
    })
    return _.find(endpoints, { method, path })
  }

  describe('GET', () => {
    describe('/tag/{tagType}', () => {
      let endpoint
      const expectedResponse = { value: 'Expected result' }

      beforeEach(() => {
        endpoint = setupRoute('GET', '/tag/{tagType}', {
          async listTags() {
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
    describe('/tag/{tagType}/{id}', () => {
      let endpoint
      const expectedResponse = { value: 'Expected result' }

      beforeEach(() => {
        endpoint = setupRoute('GET', '/tag/{tagType}/{id}', {
          async listTagsByType() {
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

  describe('PUT', () => {
    describe('/tag/{tagType}/{id}', () => {
      let endpoint
      const expectedResponse = { value: 'Expected result' }

      beforeEach(() => {
        endpoint = setupRoute('PUT', '/tag/{tagType}/{id}', {
          async updateTag() {
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
