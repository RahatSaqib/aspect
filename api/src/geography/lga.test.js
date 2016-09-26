let proxyquire = require('proxyquire')
let {assert} = require('chai')
let _ = require('lodash')
let sinon = require('sinon')
let endpointUtils = require('../../test/unit_tests/endpointUtils')

describe('lga endpoints', function () {
  let endpoints, dbSpy, endpoint

  function setupRoutes(method, path) {
    dbSpy = require('../../test/unit_tests/dbSpy')
    sinon.spy(dbSpy, 'query')
    let service = proxyquire.noCallThru().load('./lgaService', {
      '../db': dbSpy
    })
    endpoints = proxyquire('./lgaEndpoints', {
      './lgaService': service
    })
    endpoint = _.find(endpoints, {method: method, path: path})
  }

  afterEach(function() {
    dbSpy.query.restore()
  })

  describe('/lga/select-list/{stateId}', function () {
    describe('GET', function () {
      const lgas = [{id: 1, name: 'Franklin'},
          {id: 2, name: 'Suffolk'}],
        requestData = { params: { stateId: '22' } }

      beforeEach(function () {
        setupRoutes('GET', '/lga/select-list/{stateId}')
        dbSpy.query.for('Get LGAs for select list').resolvesWith(lgas)
      })

      it('Should query the lga table, sorting the results by name', function (done) {
        endpointUtils.callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(function () {
            const getCountriesQuery = dbSpy.query.withArgs('Get LGAs for select list').lastCall.returnValue
            assert.equal(getCountriesQuery.from.lastCall.args[0], 'lga as l')
            assert.deepEqual(getCountriesQuery.where.lastCall.args[0], {'l.state_id': requestData.params.stateId})
            assert.deepEqual(getCountriesQuery.orderBy.lastCall.args, ['name', 'asc'])
            assert.deepEqual(getCountriesQuery.select.lastCall.args, ['l.id', 'l.name'])
          })
          .thenCall(done)
          .execute()
      })

      it('Should respond with the list of records returned from the database', function (done) {
        endpointUtils.callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(function (responseData) {
            assert.deepEqual(responseData.data, lgas)
          })
          .thenCall(done)
          .execute()
      })
    })
  })
})
