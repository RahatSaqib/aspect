let proxyquire = require('proxyquire')
let {assert} = require('chai')
let _ = require('lodash')
let sinon = require('sinon')
let camelize = require('camelize')
let endpointUtils = require('../../test/unit_tests/endpointUtils')

describe('account details endpoints', function () {
  let accountDetails, dbSpy, endpoint

  function setupPersonRoutes(method, path) {
    dbSpy = require('../../test/unit_tests/dbSpy')
    sinon.spy(dbSpy, 'query')
    accountDetails = proxyquire.noCallThru().load('./accountDetails', {
      '../db': dbSpy
    })
    endpoint = _.find(accountDetails, {method: method, path: path})
  }

  afterEach(function() {
    dbSpy.query.restore()
  })

  describe('/account-details/current GET', function () {
    const requestData = {
        auth: {
          credentials: {
            name: 'logged-in-user'
          }
        }
      }, accountDetails = {
        id: 68,
        user_id: 4,
        username: 'admin',
        name: 'Installer Name',
        title: 'Installer',
        email: 'asdf@jalsdfj.com',
        email2: null,
        phone: null,
        cell: null,
        country_id: 1,
        state_id: null,
        lga_id: null,
        timezone: 'Eastern Standard Time',
        culture: 'en-US'
      }

    beforeEach(function () {
      setupPersonRoutes('GET', '/account-details/current')
      dbSpy.query.for('Get account details for currently logged in user').resolvesWith(accountDetails)
    })

    it('Should lookup the account details for the currently logged in user', function (done) {
      endpointUtils.callHandlerOn(endpoint)
        .with(requestData)
        .handleResponseWith(function () {
          const getPersonQuery = dbSpy.query.withArgs('Get account details for currently logged in user').lastCall.returnValue
          assert.equal(getPersonQuery.from.lastCall.args[0], 'user as u')
          assert.deepEqual(getPersonQuery.leftJoin.lastCall.args, ['person as p', 'u.id', 'p.user_id'])
          assert.deepEqual(getPersonQuery.where.lastCall.args[0], {'u.name': requestData.auth.credentials.name})
        })
        .thenCall(done)
        .execute()
    })

    it('Should respond with an account details object for the currently logged in user', function (done) {
      endpointUtils.callHandlerOn(endpoint)
        .with(requestData)
        .handleResponseWith(function (responseData) {
          assert.deepEqual(responseData.data, camelize(accountDetails))
        })
        .thenCall(done)
        .execute()
    })
  })
})
