const proxyquire = require('proxyquire')
const { assert } = require('chai')
const _ = require('lodash')
const sinon = require('sinon')
const { runTest } = require('../utils/generatorFunctionUtils')

describe('account details service', () => {
  let dbSpy
  let service
  const geographyId = 7
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
    zip: '1234',
  }

  beforeEach(() => {
    dbSpy = require('../utils/dbSpy')
    sinon.spy(dbSpy, 'query')
    service = proxyquire.noCallThru().load('../../src/accountDetails/service', {
      '../db': dbSpy,
      '../geography/service': {
        *transformGeographyFromUpdates(updates) {
          const geoFieldNames = ['countryId', 'stateId', 'lgaId']
          const geoFields = _.pick(updates, geoFieldNames)
          if (!_.isEmpty(geoFields)) {
            const transformed = _.omit(updates, geoFieldNames)
            transformed.geographyId = geographyId
            return transformed
          }
          return updates
        },
      },
    })
  })

  afterEach(() => {
    dbSpy.query.restore()
  })

  describe('getAccountDetailsForLoggedInUser', () => {
    const requestData = {
      auth: {
        credentials: {
          name: 'logged-in-user',
        },
      },
    }

    beforeEach(() => {
      dbSpy.query
        .for('Get account details for currently logged in user')
        .resolvesWith(accountDetails)
    })

    it('Should lookup the account details for the currently logged in user', () =>
      runTest(service.getAccountDetailsForLoggedInUser, [
        requestData,
      ])(response => {
        assert.isTrue(response.ok)
        assert.deepEqual(response.data, accountDetails)

        const getPersonQuery = dbSpy.query.withArgs(
          'Get account details for currently logged in user'
        ).lastCall.returnValue
        assert.equal(getPersonQuery.from.lastCall.args[0], 'User as u')
        assert.deepEqual(getPersonQuery.leftJoin.lastCall.args, [
          'Person as p',
          'u.id',
          'p.userId',
        ])
        assert.deepEqual(getPersonQuery.where.lastCall.args[0], {
          'u.name': requestData.auth.credentials.name,
        })
      }))

    it('Should respond with an account details object for the currently logged in user', () =>
      runTest(service.getAccountDetailsForLoggedInUser, [
        requestData,
      ])(response => {
        assert.deepEqual(response.data, accountDetails)
      }))
  })

  describe('saveContactDetailsForLoggedInUser', () => {
    const requestData = {
      auth: {
        credentials: {
          name: 'logged-in-user',
        },
      },
    }
    const contactDetails = {
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
      zip: '1234',
    }
    const acountDetails = Object.assign(contactDetails, {
      username: 'logged-in-user',
      userId: 123,
      timezone: 'Pacific Standard Time',
      culture: 'fr-FR',
    })

    beforeEach(() => {
      dbSpy.query
        .for('Get account details for currently logged in user')
        .resolvesWith(acountDetails)
    })

    it("Should save the user's account details which have changed and update updatedOn and updatedBy", () => {
      const changedRequestProperties = {
        title: 'Job Title has Changed',
        email2: 'secondary@email.com',
        countryId: 5,
      }

      const now = new Date()
      const clock = sinon.useFakeTimers(now.getTime())

      return runTest(service.saveContactDetailsForLoggedInUser, [
        {
          auth: requestData.auth,
          payload: Object.assign({}, contactDetails, changedRequestProperties),
        },
      ])(() => {
        const savePersonQuery = dbSpy.query.withArgs(
          'Save account details for currently logged in user'
        ).lastCall.returnValue
        assert.equal(savePersonQuery.from.lastCall.args[0], 'Person as p')
        assert.deepEqual(savePersonQuery.where.lastCall.args[0], {
          'p.id': contactDetails.id,
        })
        assert.deepEqual(
          savePersonQuery.update.lastCall.args[0],
          Object.assign(
            { geographyId },
            _.omit(changedRequestProperties, ['countryId']),
            {
              updatedOn: now,
              updatedBy: contactDetails.userId,
            }
          )
        )
        clock.restore()
      })
    })

    it('Should not save anything when no details have changed', () =>
      runTest(service.saveContactDetailsForLoggedInUser, [
        {
          auth: requestData.auth,
          payload: contactDetails,
        },
      ])(() => {
        assert.isFalse(
          dbSpy.query.withArgs(
            'Save account details for currently logged in user'
          ).called
        )
      }))

    it('Should respond with an account details object for the currently logged in user', () =>
      runTest(service.saveContactDetailsForLoggedInUser, [
        {
          auth: requestData.auth,
          payload: contactDetails,
        },
      ])(response => {
        assert.deepEqual(response.data, contactDetails)
      }))

    it('Should return an forbidden response if the account details are not the details of the currently logged in user', () => {
      dbSpy.query
        .for('Get account details for currently logged in user')
        .resolvesWith(
          Object.assign({}, contactDetails, { id: contactDetails.id + 5 })
        )

      return runTest(service.saveContactDetailsForLoggedInUser, [
        {
          auth: Object.assign({}, requestData.auth, {
            credentials: {
              name: 'another-user',
            },
          }),
          payload: contactDetails,
        },
      ])(response => {
        assert.equal(response.output.statusCode, 403)
        assert.equal(response.output.payload.message, 'Incorrect user details')
      })
    })
  })

  describe('saveUserPreferencesForLoggedInUser', () => {
    const requestData = {
      auth: {
        credentials: {
          name: 'logged-in-user',
        },
      },
    }
    const userPreferences = {
      id: 111,
      timezone: 'Eastern Standard Time',
      culture: 'en-GB',
    }
    const accountDetails = Object.assign(userPreferences, {
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
      zip: '1234',
    })

    beforeEach(() => {
      dbSpy.query
        .for('Get account details for currently logged in user')
        .resolvesWith(accountDetails)
    })

    it("Should save the user's preferences which have changed and update updatedOn and updatedBy", () => {
      const changedRequestProperties = {
        timezone: 'Pacific Standard Time',
        culture: 'fr-FR',
      }
      const changedDatabaseProperties = _.reduce(
        changedRequestProperties,
        (result, value, key) => {
          result[key] = value
          return result
        },
        {}
      )

      const now = new Date()
      const clock = sinon.useFakeTimers(now.getTime())

      return runTest(service.saveUserPreferencesForLoggedInUser, [
        {
          auth: requestData.auth,
          payload: Object.assign({}, userPreferences, changedRequestProperties),
        },
      ])(() => {
        const savePersonQuery = dbSpy.query.withArgs(
          'Save account details for currently logged in user'
        ).lastCall.returnValue
        assert.equal(savePersonQuery.from.lastCall.args[0], 'Person as p')
        assert.deepEqual(savePersonQuery.where.lastCall.args[0], {
          'p.id': userPreferences.id,
        })
        assert.deepEqual(
          savePersonQuery.update.lastCall.args[0],
          Object.assign({}, changedDatabaseProperties, {
            updatedOn: now,
            updatedBy: userPreferences.userId,
          })
        )
        clock.restore()
      })
    })

    it('Should not save anything when no details have changed', () =>
      runTest(service.saveUserPreferencesForLoggedInUser, [
        {
          auth: requestData.auth,
          payload: userPreferences,
        },
      ])(() => {
        assert.isFalse(
          dbSpy.query.withArgs(
            'Save account details for currently logged in user'
          ).called
        )
      }))

    it('Should respond with an account details object for the currently logged in user', () =>
      runTest(service.saveUserPreferencesForLoggedInUser, [
        {
          auth: requestData.auth,
          payload: userPreferences,
        },
      ])(response => {
        assert.deepEqual(response.data, userPreferences)
      }))

    it('Should return an bad request response if the account details are not the details of the currently logged in user', () => {
      dbSpy.query
        .for('Get account details for currently logged in user')
        .resolvesWith(
          Object.assign({}, userPreferences, { id: userPreferences.id + 5 })
        )

      return runTest(service.saveUserPreferencesForLoggedInUser, [
        {
          auth: Object.assign({}, requestData.auth, {
            credentials: {
              name: 'another-user',
            },
          }),
          payload: userPreferences,
        },
      ])(response => {
        assert.equal(response.output.statusCode, 403)
        assert.equal(response.output.payload.message, 'Incorrect user details')
      })
    })
  })
})
