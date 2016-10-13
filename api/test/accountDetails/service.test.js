let proxyquire = require('proxyquire')
let {assert} = require('chai')
let _ = require('lodash')
let sinon = require('sinon')
let {run} = require('../utils/generatorFunctionUtils')

describe('account details service', function () {
  let dbSpy, service
  const accountDetails = {
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
    dbSpy = require('../utils/dbSpy')
    sinon.spy(dbSpy, 'query')
    service = proxyquire.noCallThru().load('../../src/accountDetails/service', {
      '../db': dbSpy
    })
  })

  afterEach(function() {
    dbSpy.query.restore()
  })

  describe('getAccountDetailsForLoggedInUser', function () {
    const requestData = {
      auth: {
        credentials: {
          name: 'logged-in-user'
        }
      }
    }

    beforeEach(function () {
      dbSpy.query.for('Get account details for currently logged in user').resolvesWith(accountDetails)
    })

    it('Should lookup the account details for the currently logged in user', function () {
      return run(service.getAccountDetailsForLoggedInUser, [requestData])(function (response) {
        assert.isTrue(response.ok)
        assert.deepEqual(response.data, accountDetails)

        const getPersonQuery = dbSpy.query.withArgs('Get account details for currently logged in user').lastCall.returnValue
        assert.equal(getPersonQuery.from.lastCall.args[0], 'user as u')
        assert.deepEqual(getPersonQuery.leftJoin.lastCall.args, ['person as p', 'u.id', 'p.userId'])
        assert.deepEqual(getPersonQuery.where.lastCall.args[0], {'u.name': requestData.auth.credentials.name})
      })
    })

    it('Should respond with an account details object for the currently logged in user', function () {
      return run(service.getAccountDetailsForLoggedInUser, [requestData])(function (response) {
        assert.deepEqual(response.data, accountDetails)
      })
    })
  })

  describe('saveAccountDetailsForLoggedInUser', function () {
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
      dbSpy.query.for('Get account details for currently logged in user').resolvesWith(accountDetails)
    })

    it('Should save the user\'s account details which have changed and update updatedOn and updatedBy', function () {
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

      return run(service.saveAccountDetailsForLoggedInUser, [{
        auth: requestData.auth,
        payload: Object.assign({}, accountDetails, changedRequestProperties)
      }])(function () {
        const savePersonQuery = dbSpy.query.withArgs('Save account details for currently logged in user').lastCall.returnValue
        assert.equal(savePersonQuery.from.lastCall.args[0], 'person as p')
        assert.deepEqual(savePersonQuery.where.lastCall.args[0], {'p.id': accountDetails.id})
        assert.deepEqual(savePersonQuery.update.lastCall.args[0], Object.assign({}, changedDatabaseProperties, {
          updatedOn: now,
          updatedBy: accountDetails.userId
        }))
        clock.restore()
      })
    })

    it('Should not save anything when no details have changed', function () {
      return run(service.saveAccountDetailsForLoggedInUser, [{
        auth: requestData.auth,
        payload: accountDetails
      }])(function () {
        assert.isFalse(dbSpy.query.withArgs('Save account details for currently logged in user').called)
      })
    })

    it('Should respond with an account details object for the currently logged in user', function () {
      return run(service.saveAccountDetailsForLoggedInUser, [{
        auth: requestData.auth,
        payload: accountDetails
      }])(function (response) {
        assert.deepEqual(response.data, accountDetails)
      })
    })

    it('Should return an bad request response if the account details are not the details of the currently logged in user', function () {
      dbSpy.query.for('Get account details for currently logged in user').resolvesWith(
        Object.assign({}, accountDetails, {id: accountDetails.id + 5}))

      return run(service.saveAccountDetailsForLoggedInUser, [{
        auth: Object.assign({}, requestData.auth, {
          credentials: {
            name: 'another-user'
          }
        }),
        payload: accountDetails
      }])(function (response) {
        assert.equal(response.output.statusCode, 400)
        assert.equal(response.output.payload.message, 'Incorrect user details')
      })
    })
  })
})
