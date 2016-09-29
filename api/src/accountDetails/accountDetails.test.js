let proxyquire = require('proxyquire')
let {assert} = require('chai')
let _ = require('lodash')
let sinon = require('sinon')
let endpointUtils = require('../../test/unit_tests/endpointUtils')

describe('account details endpoints', function () {
  let endpoints, dbSpy, endpoint

  function setupRoutes(method, path) {
    dbSpy = require('../../test/unit_tests/dbSpy')
    sinon.spy(dbSpy, 'query')
    const service = proxyquire.noCallThru().load('./service', {
      '../db': dbSpy
    })
    endpoints = proxyquire('./endpoints', {
      './service': service
    })
    endpoint = _.find(endpoints, {method: method, path: path})
  }

  afterEach(function() {
    dbSpy.query.restore()
  })

  describe('/account-details/current', function () {
    describe('GET', function () {
      const requestData = {
          auth: {
            credentials: {
              name: 'logged-in-user'
            }
          }
        }, accountDetails = {
          id: 68,
          userId: 4,
          username: 'admin',
          name: 'Installer Name',
          title: 'Installer',
          email: 'asdf@jalsdfj.com',
          email2: null,
          phone: null,
          cell: null,
          countryId: 1,
          stateId: null,
          lgaId: null,
          zip: '1234',
          timezone: 'Eastern Standard Time',
          culture: 'en-US'
        }

      beforeEach(function () {
        setupRoutes('GET', '/account-details/current')
        dbSpy.query.for('Get account details for currently logged in user').resolvesWith(accountDetails)
      })

      it('Should lookup the account details for the currently logged in user', function (done) {
        endpointUtils.callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(function (response) {
            assert.isTrue(response.ok)
            assert.deepEqual(response.data, accountDetails)

            const getPersonQuery = dbSpy.query.withArgs('Get account details for currently logged in user').lastCall.returnValue
            assert.equal(getPersonQuery.from.lastCall.args[0], 'user as u')
            assert.deepEqual(getPersonQuery.leftJoin.lastCall.args, ['person as p', 'u.id', 'p.userId'])
            assert.deepEqual(getPersonQuery.where.lastCall.args[0], {'u.name': requestData.auth.credentials.name})
          })
          .thenCall(done)
          .execute()
      })

      it('Should respond with an account details object for the currently logged in user', function (done) {
        endpointUtils.callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(function (responseData) {
            assert.deepEqual(responseData.data, accountDetails)
          })
          .thenCall(done)
          .execute()
      })
    })

    describe('PUT', function () {
      const requestData = {
          auth: {
            credentials: {
              name: 'logged-in-user'
            }
          }
        }, accountDetails = {
          id: 111,
          userId: 12,
          username: 'logged-in-user',
          name: 'John Smith',
          title: 'Analyst',
          email: 'jsmith@systemone.id',
          email2: null,
          phone: null,
          cell: null,
          countryId: 1,
          stateId: null,
          lgaId: null,
          zip: '1234',
          timezone: 'Eastern Standard Time',
          culture: 'en-GB'
        }

      beforeEach(function () {
        setupRoutes('PUT', '/account-details/current')
        dbSpy.query.for('Get account details for currently logged in user').resolvesWith(accountDetails)

      })

      it('Should save the user\'s account details which have changed and update updatedOn and updatedBy', function (done) {
        const changedRequestProperties = {
          title: 'Job Title has Changed',
          email2: 'secondary@email.com',
          countryId: 5
        }
        const changedDatabaseProperties = _.reduce(changedRequestProperties, function(result, value, key) {
          result[key] = value
          return result
        }, {})

        const now = new Date()
        const clock = sinon.useFakeTimers(now.getTime())
        endpointUtils.callHandlerOn(endpoint)
          .with({
            auth: requestData.auth,
            payload: Object.assign({}, accountDetails, changedRequestProperties)
          })
          .handleResponseWith(function () {
            const savePersonQuery = dbSpy.query.withArgs('Save account details for currently logged in user').lastCall.returnValue
            assert.equal(savePersonQuery.from.lastCall.args[0], 'person as p')
            assert.deepEqual(savePersonQuery.where.lastCall.args[0], {'p.id': accountDetails.id})
            assert.deepEqual(savePersonQuery.update.lastCall.args[0], Object.assign({}, changedDatabaseProperties, {
              updatedOn: now,
              updatedBy: accountDetails.userId
            }))
            clock.restore()
          })
          .thenCall(done)
          .execute()
      })

      it('Should not save anything when no details have changed', function (done) {
        endpointUtils.callHandlerOn(endpoint)
          .with({
            auth: requestData.auth,
            payload: accountDetails
          })
          .handleResponseWith(function () {
            assert.isFalse(dbSpy.query.withArgs('Save account details for currently logged in user').called)
          })
          .thenCall(done)
          .execute()
      })

      it('Should respond with an account details object for the currently logged in user', function (done) {
        endpointUtils.callHandlerOn(endpoint)
          .with({
            auth: requestData.auth,
            payload: accountDetails
          })
          .handleResponseWith(function (responseData) {
            assert.deepEqual(responseData.data, accountDetails)
          })
          .thenCall(done)
          .execute()
      })

      it('Should return an bad request response if the account details are not the details of the currently logged in user', function (done) {
        dbSpy.query.for('Get account details for currently logged in user').resolvesWith(
          Object.assign({}, accountDetails, {id: accountDetails.id + 5}))

        endpointUtils.callHandlerOn(endpoint)
          .with({
            auth: Object.assign({}, requestData.auth, {
              credentials: {
                name: 'another-user'
              }
            }),
            payload: accountDetails
          })
          .handleResponseWith(function (responseData) {
            assert.equal(responseData.output.statusCode, 400)
            assert.equal(responseData.output.payload.message, 'Incorrect user details')
          })
          .thenCall(done)
          .execute()
      })
    })
  })
})
