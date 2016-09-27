let proxyquire = require('proxyquire')
let {assert} = require('chai')
let _ = require('lodash')
let endpointUtils = require('../../test/unit_tests/endpointUtils')

describe('geography endpoints', function () {
  let endpoints, endpoint

  function setupRoutes(method, path, serviceStub) {
    endpoints = proxyquire('./endpoints', {
      './service': serviceStub
    })
    endpoint = _.find(endpoints, {method: method, path: path})
  }

  describe('/geography/select-list', function () {
    describe('GET', function () {
      let expectedResponse = [ 'List of Countries' ]

      beforeEach(function () {
        let serviceStub = {
          buildGeographySelectList: function* () { return [ 'List of Countries' ] }
        }
        setupRoutes('GET', '/geography/select-list', serviceStub)
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
