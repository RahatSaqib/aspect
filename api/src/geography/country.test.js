let proxyquire = require('proxyquire')
let {assert} = require('chai')
let _ = require('lodash')
let sinon = require('sinon')
let endpointUtils = require('../../test/unit_tests/endpointUtils')

describe('country endpoints', function () {
  let endpoints, dbSpy, endpoint

  function setupRoutes(method, path) {
    dbSpy = require('../../test/unit_tests/dbSpy')
    sinon.spy(dbSpy, 'query')
    let service = proxyquire.noCallThru().load('./countryService', {
      '../db': dbSpy
    })
    endpoints = proxyquire('./countryEndpoints', {
      './countryService': service
    })
    endpoint = _.find(endpoints, {method: method, path: path})
  }

  afterEach(function() {
    dbSpy.query.restore()
  })

  describe('/country/select-list', function () {
    describe('GET', function () {
      const countries = [{ id: 5, name: 'Malawi' },
        { id: 2, name: 'South Africa' },
        { id: 3, name: 'Swaziland' },
        { id: 1, name: 'United States' },
        { id: 4, name: 'Zimbabwe' }]

      beforeEach(function () {
        setupRoutes('GET', '/country/select-list')
        dbSpy.query.for('Get countries for select list').resolvesWith(countries)
      })

      it('Should query the country table, sorting the results by name', function (done) {
        endpointUtils.callHandlerOn(endpoint)
          .handleResponseWith(function () {
            const getCountriesQuery = dbSpy.query.withArgs('Get countries for select list').lastCall.returnValue
            assert.equal(getCountriesQuery.from.lastCall.args[0], 'country as c')
            assert.deepEqual(getCountriesQuery.orderBy.lastCall.args, ['name', 'asc'])
            assert.deepEqual(getCountriesQuery.select.lastCall.args, ['c.id', 'c.name'])
          })
          .thenCall(done)
          .execute()
      })

      it('Should respond with the list of records returned from the database', function (done) {
        endpointUtils.callHandlerOn(endpoint)
          .handleResponseWith(function (responseData) {
            assert.deepEqual(responseData.data, countries)
          })
          .thenCall(done)
          .execute()
      })
    })
  })
})
