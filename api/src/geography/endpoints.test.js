let proxyquire = require('proxyquire')
let {assert} = require('chai')
let _ = require('lodash')
let endpointUtils = require('../../test/unit_tests/endpointUtils')

describe('geography endpoints', function () {
  function setupRoute(method, path, serviceStub) {
    let endpoints = proxyquire('./endpoints', {
      './service': serviceStub
    })
    return _.find(endpoints, {method: method, path: path})
  }

  describe('/geography/select-list', function () {
    describe('GET', function () {
      let endpoint, expectedResponse = [ 'List of Countries' ]

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
})
