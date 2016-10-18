let proxyquire = require('proxyquire')
let {assert} = require('chai')
let _ = require('lodash')
let sinon = require('sinon')
let {run} = require('../utils/generatorFunctionUtils')

describe('account details service', function () {
  let dbSpy, service
  const accountDetails = {
    id: 68,
    name: 'Installer Name',
    title: 'Installer',
    email: 'asdf@jalsdfj.com',
    email2: null,
    phone: null,
    cell: null,
    countryId: 1,
    stateId: null,
    lgaId: null,
    zip: '1234'
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
        assert.equal(getPersonQuery.from.lastCall.args[0], 'User as u')
        assert.deepEqual(getPersonQuery.leftJoin.lastCall.args, ['Person as p', 'u.id', 'p.userId'])
        assert.deepEqual(getPersonQuery.where.lastCall.args[0], {'u.name': requestData.auth.credentials.name})
      })
    })

    it('Should respond with an account details object for the currently logged in user', function () {
      return run(service.getAccountDetailsForLoggedInUser, [requestData])(function (response) {
        assert.deepEqual(response.data, accountDetails)
      })
    })
  })

  describe('saveContactDetailsForLoggedInUser', function () {
    const requestData = {
        auth: {
          credentials: {
            name: 'logged-in-user'
          }
        }
      }, contactDetails = {
        id: 111,
        name: 'John Smith',
        title: 'Analyst',
        email: 'jsmith@systemone.id',
        email2: null,
        phone: null,
        cell: null,
        countryId: 1,
        stateId: null,
        lgaId: null,
        zip: '1234'
      }, acountDetails = Object.assign(contactDetails, {
        username: 'logged-in-user',
        userId: 123,
        timezone: 'Pacific Standard Time',
        culture: 'fr-FR'
      })

    beforeEach(function () {
      dbSpy.query.for('Get account details for currently logged in user').resolvesWith(acountDetails)
    })

    it('Should save the user\'s account details which have changed and update updatedOn and updatedBy', function () {
      const changedRequestProperties = {
        title: 'Job Title has Changed',
        email2: 'secondary@email.com',
        countryId: 5
      }

      const now = new Date(), clock = sinon.useFakeTimers(now.getTime())

      return run(service.saveContactDetailsForLoggedInUser, [{
        auth: requestData.auth,
        payload: Object.assign({}, contactDetails, changedRequestProperties)
      }])(function () {
        const savePersonQuery = dbSpy.query.withArgs('Save account details for currently logged in user').lastCall.returnValue
        assert.equal(savePersonQuery.from.lastCall.args[0], 'Person as p')
        assert.deepEqual(savePersonQuery.where.lastCall.args[0], {'p.id': accountDetails.id})
        assert.deepEqual(savePersonQuery.update.lastCall.args[0], Object.assign({}, changedRequestProperties, {
          updatedOn: now,
          updatedBy: contactDetails.userId
        }))
        clock.restore()
      })
    })

    it('Should not save anything when no details have changed', function () {
      return run(service.saveContactDetailsForLoggedInUser, [{
        auth: requestData.auth,
        payload: contactDetails
      }])(function () {
        assert.isFalse(dbSpy.query.withArgs('Save account details for currently logged in user').called)
      })
    })

    it('Should respond with an account details object for the currently logged in user', function () {
      return run(service.saveContactDetailsForLoggedInUser, [{
        auth: requestData.auth,
        payload: contactDetails
      }])(function (response) {
        assert.deepEqual(response.data, contactDetails)
      })
    })

    it('Should return an bad request response if the account details are not the details of the currently logged in user', function () {
      dbSpy.query.for('Get account details for currently logged in user').resolvesWith(
        Object.assign({}, contactDetails, {id: contactDetails.id + 5}))

      return run(service.saveContactDetailsForLoggedInUser, [{
        auth: Object.assign({}, requestData.auth, {
          credentials: {
            name: 'another-user'
          }
        }),
        payload: contactDetails
      }])(function (response) {
        assert.equal(response.output.statusCode, 400)
        assert.equal(response.output.payload.message, 'Incorrect user details')
      })
    })
  })

  describe('saveUserPreferencesForLoggedInUser', function () {
    const requestData = {
      auth: {
        credentials: {
          name: 'logged-in-user'
        }
      }
    }, userPreferences = {
      id: 111,
      timezone: 'Eastern Standard Time',
      culture: 'en-GB'
    }, accountDetails = Object.assign(userPreferences, {
      username: 'logged-in-user',
      userId: 123,
      name: 'John Smith',
      title: 'Analyst',
      email: 'jsmith@systemone.id',
      email2: null,
      phone: null,
      cell: null,
      countryId: 1,
      stateId: null,
      lgaId: null,
      zip: '1234'
    })

    beforeEach(function () {
      dbSpy.query.for('Get account details for currently logged in user').resolvesWith(accountDetails)
    })

    it('Should save the user\'s preferences which have changed and update updatedOn and updatedBy', function () {
      const changedRequestProperties = {
        timezone: 'Pacific Standard Time',
        culture: 'fr-FR'
      }
      const changedDatabaseProperties = _.reduce(changedRequestProperties, function(result, value, key) {
        result[key] = value
        return result
      }, {})

      const now = new Date(), clock = sinon.useFakeTimers(now.getTime())

      return run(service.saveUserPreferencesForLoggedInUser, [{
        auth: requestData.auth,
        payload: Object.assign({}, userPreferences, changedRequestProperties)
      }])(function () {
        const savePersonQuery = dbSpy.query.withArgs('Save account details for currently logged in user').lastCall.returnValue
        assert.equal(savePersonQuery.from.lastCall.args[0], 'Person as p')
        assert.deepEqual(savePersonQuery.where.lastCall.args[0], {'p.id': userPreferences.id})
        assert.deepEqual(savePersonQuery.update.lastCall.args[0], Object.assign({}, changedDatabaseProperties, {
          updatedOn: now,
          updatedBy: userPreferences.userId
        }))
        clock.restore()
      })
    })

    it('Should not save anything when no details have changed', function () {
      return run(service.saveUserPreferencesForLoggedInUser, [{
        auth: requestData.auth,
        payload: userPreferences
      }])(function () {
        assert.isFalse(dbSpy.query.withArgs('Save account details for currently logged in user').called)
      })
    })

    it('Should respond with an account details object for the currently logged in user', function () {
      return run(service.saveUserPreferencesForLoggedInUser, [{
        auth: requestData.auth,
        payload: userPreferences
      }])(function (response) {
        assert.deepEqual(response.data, userPreferences)
      })
    })

    it('Should return an bad request response if the account details are not the details of the currently logged in user', function () {
      dbSpy.query.for('Get account details for currently logged in user').resolvesWith(
        Object.assign({}, userPreferences, {id: userPreferences.id + 5}))

      return run(service.saveUserPreferencesForLoggedInUser, [{
        auth: Object.assign({}, requestData.auth, {
          credentials: {
            name: 'another-user'
          }
        }),
        payload: userPreferences
      }])(function (response) {
        assert.equal(response.output.statusCode, 403)
        assert.equal(response.output.payload.message, 'Incorrect user details')
      })
    })
  })
})
