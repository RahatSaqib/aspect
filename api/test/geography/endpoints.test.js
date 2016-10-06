let proxyquire = require('proxyquire')
let {assert} = require('chai')
let _ = require('lodash')
let endpointUtils = require('../utils/endpointUtils')

describe('geography endpoints', function () {
  function setupRoute(method, path, serviceStub) {
    const endpoints = proxyquire('../../src/geography/endpoints', {
      './service': serviceStub
    })
    return _.find(endpoints, {method: method, path: path})
  }

  describe('/geography/select-list', function () {
    describe('GET', function () {
      let endpoint
      const expectedResponse = [ 'List of Countries' ]

      beforeEach(function () {
        endpoint = setupRoute('GET', '/geography/select-list', {
          buildGeographySelectList: function* () { return expectedResponse }
        })
      })

      it('Should respond with a the data returned from the service', function (done) {
        endpointUtils.callHandlerOn(endpoint)
          .handleResponseWith(function (response) {
            assert.deepEqual(response, expectedResponse)
          })
          .thenCall(done)
          .execute()
      })
    })
  })

  describe('/geography/country-select-list', function () {
    describe('GET', function () {
      let endpoint
      const expectedResponse = [ 'List of Countries' ]

      beforeEach(function () {
        endpoint = setupRoute('GET', '/geography/country-select-list', {
          countrySelectList: function* () { return expectedResponse }
        })
      })

      it('Should respond with a the data returned from the service', function (done) {
        endpointUtils.callHandlerOn(endpoint)
          .handleResponseWith(function (response) {
            assert.deepEqual(response, expectedResponse)
          })
          .thenCall(done)
          .execute()
      })
    })
  })

  describe('/geography/state-select-list/{countryId}', function () {
    describe('GET', function () {
      let endpoint
      const expectedResponse = [ 'List of States' ]

      beforeEach(function () {
        endpoint = setupRoute('GET', '/geography/state-select-list/{countryId}', {
          stateSelectList: function* () { return expectedResponse }
        })
      })

      it('Should respond with a the data returned from the service', function (done) {
        endpointUtils.callHandlerOn(endpoint)
          .handleResponseWith(function (response) {
            assert.deepEqual(response, expectedResponse)
          })
          .thenCall(done)
          .execute()
      })
    })
  })

  describe('/geography/lga-select-list/{stateId}', function () {
    describe('GET', function () {
      let endpoint
      const expectedResponse = [ 'List of LGAs' ]

      beforeEach(function () {
        endpoint = setupRoute('GET', '/geography/lga-select-list/{stateId}', {
          lgaSelectList: function* () { return expectedResponse }
        })
      })

      it('Should respond with a the data returned from the service', function (done) {
        endpointUtils.callHandlerOn(endpoint)
          .handleResponseWith(function (response) {
            assert.deepEqual(response, expectedResponse)
          })
          .thenCall(done)
          .execute()
      })
    })
  })
})
