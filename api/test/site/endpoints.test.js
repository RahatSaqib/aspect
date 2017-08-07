const proxyquire = require('proxyquire')
const { assert } = require('chai')
const _ = require('lodash')
const endpointUtils = require('../utils/endpointUtils')

describe('site endpoints', () => {
  function setupRoute(method, path, serviceStub) {
    const endpoints = proxyquire('../../src/site/endpoints', {
      './service': serviceStub,
    })
    return _.find(endpoints, { method, path })
  }

  describe('GET', () => {
    describe('/site', () => {
      let endpoint
      const expectedResponse = { value: 'Expected result' }

      beforeEach(() => {
        endpoint = setupRoute('GET', '/site', {
          *listSites() {
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

    describe('/site/{siteId}', () => {
      let endpoint
      const expectedResponse = { value: 'Expected result' }

      beforeEach(() => {
        endpoint = setupRoute('GET', '/site/{siteId}', {
          *showSite() {
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

    describe('/site/select-list', () => {
      let endpoint
      const expectedResponse = { value: 'Expected result' }

      beforeEach(() => {
        endpoint = setupRoute('GET', '/site/select-list', {
          *listSitesForSelectList() {
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
    describe('/site/{siteId}', () => {
      let endpoint
      const expectedResponse = { value: 'Expected result' }

      beforeEach(() => {
        endpoint = setupRoute('PUT', '/site/{siteId}', {
          *updateSite() {
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
