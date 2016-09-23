let proxyquire = require('proxyquire')
let {assert} = require('chai')
let _ = require('lodash')
let sinon = require('sinon')
let endpointUtils = require('../../test/unit_tests/endpointUtils')

describe('state endpoints', function () {
  let state, dbSpy, endpoint

  function setupPersonRoutes(method, path) {
    dbSpy = require('../../test/unit_tests/dbSpy')
    sinon.spy(dbSpy, 'query')
    state = proxyquire.noCallThru().load('./state', {
      '../db': dbSpy
    })
    endpoint = _.find(state, {method: method, path: path})
  }

  afterEach(function() {
    dbSpy.query.restore()
  })

  describe('/state/select-list/{countryId}', function () {
    describe('GET', function () {
      const states = [{id: 1, name: 'Alaska'},
        {id: 2, name: 'Alabama'},
        {id: 3, name: 'Arkansas'},
        {id: 4, name: 'Arizona'},
        {id: 5, name: 'California'},
        {id: 6, name: 'Colorado'},
        {id: 7, name: 'Connecticut'},
        {id: 8, name: 'District of Columbia'},
        {id: 9, name: 'Delaware'},
        {id: 10, name: 'Florida'},
        {id: 11, name: 'Georgia'},
        {id: 12, name: 'Hawaii'},
        {id: 13, name: 'Iowa'},
        {id: 14, name: 'Idaho'},
        {id: 15, name: 'Illinois'},
        {id: 16, name: 'Indiana'},
        {id: 17, name: 'Kansas'},
        {id: 18, name: 'Kentucky'},
        {id: 19, name: 'Louisiana'},
        {id: 20, name: 'Maryland'},
        {id: 21, name: 'Maine'},
        {id: 22, name: 'Massachusetts'},
        {id: 23, name: 'Michigan'},
        {id: 24, name: 'Minnesota'},
        {id: 25, name: 'Missouri'},
        {id: 26, name: 'Mississippi'},
        {id: 27, name: 'Montana'},
        {id: 28, name: 'North Carolina'},
        {id: 29, name: 'North Dakota'},
        {id: 30, name: 'Nebraska'},
        {id: 31, name: 'New Hampshire'},
        {id: 32, name: 'New Jersey'},
        {id: 33, name: 'New Mexico'},
        {id: 34, name: 'Nevada'},
        {id: 35, name: 'New York'},
        {id: 36, name: 'Oklahoma'},
        {id: 37, name: 'Ohio'},
        {id: 38, name: 'Oregon'},
        {id: 39, name: 'Pennsylvania'},
        {id: 40, name: 'Rhode Island'},
        {id: 41, name: 'South Carolina'},
        {id: 42, name: 'South Dakota'},
        {id: 43, name: 'Tennessee'},
        {id: 44, name: 'Texas'},
        {id: 45, name: 'Utah'},
        {id: 46, name: 'Virginia'},
        {id: 47, name: 'Vermont'},
        {id: 48, name: 'Washington'},
        {id: 49, name: 'Wisconsin'},
        {id: 50, name: 'West Virginia'},
        {id: 51, name: 'Wyoming'}],
        requestData = { params: { countryId: '1' } }

      beforeEach(function () {
        setupPersonRoutes('GET', '/state/select-list/{countryId}')
        dbSpy.query.for('Get states for select list').resolvesWith(states)
      })

      it('Should query the state table, sorting the results by name', function (done) {
        endpointUtils.callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(function () {
            const getCountriesQuery = dbSpy.query.withArgs('Get states for select list').lastCall.returnValue
            assert.equal(getCountriesQuery.from.lastCall.args[0], 'state as s')
            assert.deepEqual(getCountriesQuery.where.lastCall.args[0], {'s.country_id': requestData.params.countryId})
            assert.deepEqual(getCountriesQuery.orderBy.lastCall.args, ['name', 'asc'])
            assert.deepEqual(getCountriesQuery.select.lastCall.args, ['s.id', 's.name'])
          })
          .thenCall(done)
          .execute()
      })

      it('Should respond with the list of records returned from the database', function (done) {
        endpointUtils.callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(function (responseData) {
            assert.deepEqual(responseData.data, states)
          })
          .thenCall(done)
          .execute()
      })
    })
  })
})
