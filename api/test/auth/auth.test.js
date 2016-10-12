let proxyquire = require('proxyquire')
let {assert} = require('chai')
let _ = require('lodash')
let sinon = require('sinon')
let endpointUtils = require('../utils/endpointUtils')
const validHashedPassword = '$2a$10$blGsMw08vX52YoZUnI18cOTluN170WvPJq1XApyif8Y2PuZThzK5K' // = test07

describe('auth endpoints', function () {
  let dbSpy, jwt, endpoint
  const fakeConfig = { secret: '8rU7FITwHV30jhkcXvjOjoSvy2Tv2bZT', passwordAttempts: 5 },
    now = new Date(), clock = sinon.useFakeTimers(now.getTime())

  function setupAuthRoutes(method, path) {
    dbSpy = require('../utils/dbSpy')
    sinon.spy(dbSpy, 'query')
    jwt = require('jsonwebtoken')
    sinon.spy(jwt, 'sign')
    let service = proxyquire.noCallThru().load('../../src/auth/service', {
      'jsonwebtoken': jwt,
      '../db': dbSpy,
      '../config': fakeConfig
    })
    let endpoints = proxyquire.noCallThru().load('../../src/auth/endpoints', {
      './service': service
    })
    endpoint = _.find(endpoints, {method: method, path: path})
  }

  afterEach(function() {
    dbSpy.query.restore()
    jwt.sign.restore()
  })

  after(function() {
    clock.restore()
  })

  describe('/auth GET', function () {
    beforeEach(function () {
      setupAuthRoutes('GET', '/auth')
    })

    it('Should respond with a welcome message for the API', function (done) {
      endpointUtils.callHandlerOn(endpoint)
        .handleResponseWith(function (responseData) {
          assert.equal(responseData.message, 'Welcome to the API!')
        })
        .thenCall(done)
        .execute()
    })
  })

  describe('/auth POST', function () {
    beforeEach(function () {
      setupAuthRoutes('POST', '/auth')
    })

    describe('When the user can authenticate', function () {
      const permissions = [
        {module: 'device', activity: 'view'},
        {module: 'person', activity: 'view'},
        {module: 'site', activity: 'view'}
      ]
      beforeEach(function () {
        dbSpy.query.for('Get basic user details').resolvesWith({
          lockedOut: 0,
          failedPasswordAttempts: 0,
          id: 123,
          name: 'admin',
          culture: 'en-US',
          password: validHashedPassword
        })
        dbSpy.query.for('Get permissions for user and partner').resolvesWith(permissions)
      })

      it('Should respond with a signed JSON web token, a refresh token id and the client id passed to it', function (done) {
        const requestData = {
          payload: {
            name: 'admin',
            password: 'test07',
            clientId: 'request client id'
          }
        }
        endpointUtils.callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(function (responseData) {
            assert.isOk(responseData.access)
            assert.isOk(responseData.refresh)
            assert.equal(responseData.clientId, requestData.payload.clientId)
          })
          .thenCall(done)
          .execute()
      })

      it('Should create a client id if none is provided', function (done) {
        const requestData = {
          payload: {
            name: 'admin',
            password: 'test07',
            clientId: ''
          }
        }
        endpointUtils.callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(function (responseData) {
            assert.isOk(responseData.clientId, requestData.payload.clientId)
          })
          .thenCall(done)
          .execute()
      })

      describe('getToken', function() {
        it('Should sign a token with the user\'s details', function (done) {
          let britishUser = {
            lockedOut: 0,
            failedPasswordAttempts: 0,
            id: 123,
            name: 'admin',
            password: validHashedPassword,
            culture: 'en-GB',
            partnerId: 2,
            countryId: 3
          }
          dbSpy.query.for('Get basic user details').resolvesWith(britishUser)
          const requestData = {
            payload: {
              name: 'admin',
              password: 'test07',
              clientId: 'request client id'
            }
          }
          endpointUtils.callHandlerOn(endpoint)
            .with(requestData)
            .handleResponseWith(function () {
              let unsignedToken = jwt.sign.lastCall.args[0]
              assert.deepEqual(unsignedToken, {
                id: 123,
                partnerId: 2,
                countryId: 3,
                name: britishUser.name,
                modules: permissions.map(p => p.module),
                permissions: permissions.map(p => `${p.module}:${p.activity}`),
                culture: britishUser.culture
              })
            })
            .thenCall(done)
            .execute()
        })

        it('Should set the user\'s culture to en-US if not specified', function (done) {
          dbSpy.query.for('Get basic user details').resolvesWith({
            lockedOut: 0,
            failedPasswordAttempts: 0,
            id: 123,
            name: 'admin',
            password: validHashedPassword,
            culture: ''
          })
          const requestData = {
            payload: {
              name: 'admin',
              password: 'test07',
              clientId: 'request client id'
            }
          }
          endpointUtils.callHandlerOn(endpoint)
            .with(requestData)
            .handleResponseWith(function () {
              let unsignedToken = jwt.sign.lastCall.args[0]
              assert.equal(unsignedToken.culture, 'en-US')
            })
            .thenCall(done)
            .execute()
        })
      })
    })

    describe('When a user is not found', function () {
      beforeEach(function () {
        dbSpy.query.for('Get basic user details').resolvesWith()
      })

      it('Should respond with 401', function (done) {
        const requestData = {
          payload: {
            name: 'nonexistant',
            password: 'whatevs',
            clientId: 'request client id'
          }
        }
        endpointUtils.callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(function (responseData) {
            assert.equal(responseData.output.statusCode, 401)
          })
          .thenCall(done)
          .execute()
      })
    })

    describe('When the users account is locked', function () {
      beforeEach(function () {
        dbSpy.query.for('Get basic user details').resolvesWith({
          lockedOut: 1,
          failedPasswordAttempts: 0,
          id: 123,
          name: 'lockedaccount',
          password: 'whatevs',
          culture: 'en-US',
          password: ''
        })
      })

      it('Should respond with 401 and "Your account is locked."', function (done) {
        const requestData = {
          payload: {
            name: 'lockedaccount',
            password: 'test07',
            clientId: 'request client id'
          }
        }
        endpointUtils.callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(function (responseData) {
            assert.equal(responseData.output.statusCode, 401)
            assert.equal(responseData.output.payload.message, 'Your account is locked.')
          })
          .thenCall(done)
          .execute()
      })
    })

    describe('When the password is incorrect', function () {
      const requestData = {
          payload: {
            name: 'admin',
            password: 'wrongpassword',
            clientId: 'request client id'
          }
        }, basicUserDetails = {
          lockedOut: 0,
          failedPasswordAttempts: 0,
          id: 123,
          password: validHashedPassword,
          name: 'admin',
          culture: 'en-US'
        }
      beforeEach(function () {
        dbSpy.query.for('Get basic user details').resolvesWith(basicUserDetails)
      })

      it('Should increment the number of failed password attempts and respond with 401 and "Authentication failed. Wrong password."', function (done) {
        endpointUtils.callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(function (responseData) {
            assert.equal(responseData.output.statusCode, 401)
            assert.equal(responseData.output.payload.message, 'Authentication failed. Wrong password.')
            let updateFieldsOnUser = dbSpy.query.withArgs('Update failed password attempts and set locked out status on user').lastCall.returnValue.update.lastCall.args[0]
            assert.equal(updateFieldsOnUser.failedPasswordAttempts, basicUserDetails.failedPasswordAttempts + 1)
          })
          .thenCall(done)
          .execute()
      })

      it('Should increment the number of failed password attempts and lock the user out after the maximum password attempts have been tried', function (done) {
        basicUserDetails.failedPasswordAttempts = 5
        endpointUtils.callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(function () {
            assert.isOk(dbSpy.query.calledWith('Update failed password attempts and set locked out status on user'))
            let updateFieldsOnUser = dbSpy.query.withArgs('Update failed password attempts and set locked out status on user').lastCall.returnValue.update.lastCall.args[0]
            assert.equal(updateFieldsOnUser.failedPasswordAttempts, basicUserDetails.failedPasswordAttempts + 1)
            assert.equal(updateFieldsOnUser.lockedOut, 1)
          })
          .thenCall(done)
          .execute()
      })
    })
  })

  describe('/auth/refresh POST', function () {
    beforeEach(function () {
      setupAuthRoutes('POST', '/auth/refresh')
    })

    describe('When a valid token exists', function () {
      beforeEach(function () {
        dbSpy.query.for('Find existing token for client ID').resolvesWith({
          userId: 123,
          expires: new Date(new Date().getTime() + 7 * 86400000),
          name: 'admin',
          culture: 'en-US'
        })
      })

      it('Should respond with a signed JSON web token, a refresh token id and the client id passed to it', function (done) {
        const requestData = {
          payload: {
            clientId: 'request client id',
            token: 'A+nmAmjiD0BqrZvfhrIRlnAoufJW0mhigNWa1Fnz/gl8JWsec4ochW9K5iaz3XcR'
          }
        }
        endpointUtils.callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(function (responseData) {
            assert.isOk(responseData.access)
            assert.isOk(responseData.refresh)
            assert.equal(responseData.clientId, requestData.payload.clientId)
          })
          .thenCall(done)
          .execute()
      })
    })

    describe('When no token is found', function () {
      beforeEach(function () {
        dbSpy.query.for('Find existing token for client ID').resolvesWith()
      })

      it('Should respond with 400 and "Unable to find token or token revoked"', function (done) {
        const requestData = {
          payload: {
            clientId: 'request client id',
            token: 'A+nmAmjiD0BqrZvfhrIRlnAoufJW0mhigNWa1Fnz/gl8JWsec4ochW9K5iaz3XcR'
          }
        }
        endpointUtils.callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(function (responseData) {
            assert.equal(responseData.output.statusCode, 400)
            assert.equal(responseData.output.payload.message, 'Unable to find token or token revoked')
          })
          .thenCall(done)
          .execute()
      })
    })

    describe('When the token has expired', function () {
      beforeEach(function () {
        dbSpy.query.for('Find existing token for client ID').resolvesWith({
          userId: 123,
          expires: new Date(new Date().getTime() - 1),
          name: 'admin',
          culture: 'en-US'
        })
      })

      it('Should respond with 400 and "Token expired"', function (done) {
        const requestData = {
          payload: {
            clientId: 'request client id',
            token: 'A+nmAmjiD0BqrZvfhrIRlnAoufJW0mhigNWa1Fnz/gl8JWsec4ochW9K5iaz3XcR'
          }
        }
        endpointUtils.callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(function (responseData) {
            assert.equal(responseData.output.statusCode, 400)
            assert.equal(responseData.output.payload.message, 'Token expired')
          })
          .thenCall(done)
          .execute()
      })
    })
  })

  describe('/auth/update-login-details PUT', function () {
    beforeEach(function () {
      setupAuthRoutes('PUT', '/auth/update-login-details')
    })

    describe('When the user is changing both their username and password', function () {
      beforeEach(function () {
        dbSpy.query.for('Get ID, username and password details for logged in user').resolvesWith({
          id: 123,
          name: 'logged-in-user',
          password: 'old-password',
          passwordKey: 'password key'
        })
      })

      it('should respond with a the list of fields that were updated', function (done) {
        const requestData = {
          auth: {
            credentials: {
              name: 'logged-in-user'
            }
          }, payload: {
            newUsername: 'new-username',
            currentPassword: 'test07',
            newPassword: 'new-password'
          }
        }
        endpointUtils.callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(function (response) {
            assert.isOk(response.ok)
            assert.include(response.data, 'name')
            assert.include(response.data, 'password')
          })
          .thenCall(done)
          .execute()
      })

      it('should save the user\'s details', function (done) {
        const requestData = {
          auth: {
            credentials: {
              name: 'logged-in-user'
            }
          }, payload: {
            newUsername: 'new-username',
            currentPassword: 'test07',
            newPassword: 'new-password'
          }
        }
        endpointUtils.callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(function () {
            const updateUserDetails = dbSpy.query.withArgs('Save user details for currently logged in user').lastCall.returnValue.update.lastCall.args[0]
            assert.isOk(updateUserDetails.password)
            assert.deepEqual(updateUserDetails, Object.assign(updateUserDetails, {
              updatedOn: now,
              updatedBy: 123,
              name: requestData.payload.newUsername
            }))
          })
          .thenCall(done)
          .execute()
      })
    })

    describe('When the user is only changing their username', function () {
      beforeEach(function () {
        dbSpy.query.for('Get ID, username and password details for logged in user').resolvesWith({
          id: 123,
          name: 'logged-in-user',
          password: 'old-password',
          passwordKey: 'password key'
        })
      })

      it('should respond with a the list of fields that were updated', function (done) {
        const requestData = {
          auth: {
            credentials: {
              name: 'logged-in-user'
            }
          }, payload: {
            newUsername: 'new-username',
            currentPassword: 'test07',
            newPassword: ''
          }
        }
        endpointUtils.callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(function (response) {
            assert.isOk(response.ok)
            assert.include(response.data, 'name')
            assert.notInclude(response.data, 'password')
          })
          .thenCall(done)
          .execute()
      })

      it('should save the user\'s username', function (done) {
        const requestData = {
          auth: {
            credentials: {
              name: 'logged-in-user'
            }
          }, payload: {
            newUsername: 'new-username',
            currentPassword: 'test07'
          }
        }
        endpointUtils.callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(function () {
            const updateUserDetails = dbSpy.query.withArgs('Save user details for currently logged in user').lastCall.returnValue.update.lastCall.args[0]
            assert.notProperty(updateUserDetails, 'password')
            assert.deepEqual(updateUserDetails, {
              updatedOn: now,
              updatedBy: 123,
              name: requestData.payload.newUsername
            })
          })
          .thenCall(done)
          .execute()
      })
    })

    describe('When the user is only changing their password', function () {
      beforeEach(function () {
        dbSpy.query.for('Get ID, username and password details for logged in user').resolvesWith({
          id: 123,
          name: 'logged-in-user',
          password: 'old-password',
          passwordKey: 'password key'
        })
      })

      it('should respond with a the list of fields that were updated', function (done) {
        const requestData = {
          auth: {
            credentials: {
              name: 'logged-in-user'
            }
          }, payload: {
            currentPassword: 'test07',
            newPassword: 'new-password'
          }
        }
        endpointUtils.callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(function (response) {
            assert.isOk(response.ok)
            assert.notInclude(response.data, 'name')
            assert.include(response.data, 'password')
          })
          .thenCall(done)
          .execute()
      })

      it('should save the user\'s password', function (done) {
        const requestData = {
          auth: {
            credentials: {
              name: 'logged-in-user'
            }
          }, payload: {
            newUsername: '',
            currentPassword: 'test07',
            newPassword: 'new-password'
          }
        }
        endpointUtils.callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(function () {
            const updateUserDetails = dbSpy.query.withArgs('Save user details for currently logged in user').lastCall.returnValue.update.lastCall.args[0]
            assert.notProperty(updateUserDetails, 'username')
            assert.isOk(updateUserDetails.password)
            assert.deepEqual(updateUserDetails, Object.assign(updateUserDetails, {
              updatedOn: now,
              updatedBy: 123
            }))
          })
          .thenCall(done)
          .execute()
      })
    })

    describe('When current password is incorrect', function () {
      beforeEach(function () {
        dbSpy.query.for('Get ID, username and password details for logged in user').resolvesWith({
          id: 123,
          name: 'logged-in-user',
          password: 'correct-password',
          passwordKey: 'password key'
        })
      })

      it('should respond 403 forbidden', function (done) {
        const requestData = {
          auth: {
            credentials: {
              name: 'logged-in-user'
            }
          }, payload: {
            newUsername: 'new-username',
            currentPassword: 'incorrect-password',
            newPassword: 'new-password'
          }
        }
        endpointUtils.callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(function (response) {
            assert.equal(response.output.statusCode, 403)
            assert.deepEqual(response.output.payload, {
              statusCode: 403,
              error: 'Forbidden',
              message: 'Incorrect password.'
            })
          })
          .thenCall(done)
          .execute()
      })
    })

    describe('When user is trying to update another user\'s details', function () {
      beforeEach(function () {
        dbSpy.query.for('Get ID, username and password details for logged in user').resolvesWith({
          id: 123,
          name: 'another-user',
          password: 'correct-password',
          passwordKey: 'password key'
        })
      })

      it('should respond 403 forbidden', function (done) {
        const requestData = {
          auth: {
            credentials: {
              name: 'logged-in-user'
            }
          }, payload: {
            newUsername: 'new-username',
            currentPassword: 'test07',
            newPassword: 'new-password'
          }
        }
        endpointUtils.callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(function (response) {
            assert.equal(response.output.statusCode, 403)
            assert.deepEqual(response.output.payload, {
              statusCode: 403,
              error: 'Forbidden',
              message: 'Not allowed to updated another user from here.'
            })
          })
          .thenCall(done)
          .execute()
      })
    })

    describe('When the user does not exist', function () {
      beforeEach(function () {
        dbSpy.query.for('Get ID, username and password details for logged in user').resolvesWith(undefined)
      })

      it('should respond 404 not found', function (done) {
        const requestData = {
          auth: {
            credentials: {
              name: 'logged-in-user'
            }
          }, payload: {
            newUsername: 'new-username',
            currentPassword: 'test07',
            newPassword: 'new-password'
          }
        }
        endpointUtils.callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(function (response) {
            assert.equal(response.output.statusCode, 404)
            assert.deepEqual(response.output.payload, {
              statusCode: 404,
              error: 'Not Found',
              message: 'User not Found'
            })
          })
          .thenCall(done)
          .execute()
      })
    })

    describe('When the username hasn\'t changed', function () {
      beforeEach(function () {
        dbSpy.query.for('Get ID, username and password details for logged in user').resolvesWith({
          id: 123,
          name: 'logged-in-user',
          password: 'old-password',
          passwordKey: 'password key'
        })
      })

      it('should not update username', function (done) {
        const requestData = {
          auth: {
            credentials: {
              name: 'logged-in-user'
            }
          }, payload: {
            newUsername: 'logged-in-user',
            currentPassword: 'test07',
            newPassword: 'new-password'
          }
        }
        endpointUtils.callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(function (response) {
            const updateUserDetails = dbSpy.query.withArgs('Save user details for currently logged in user').lastCall.returnValue.update.lastCall.args[0]
            assert.isOk(updateUserDetails.password)
            assert.notOk(updateUserDetails.name)
            assert.deepEqual(updateUserDetails, Object.assign(updateUserDetails, {
              updatedOn: now,
              updatedBy: 123
            }))
          })
          .thenCall(done)
          .execute()
      })
    })

    describe('When the password hasn\'t changed', function () {
      beforeEach(function () {
        dbSpy.query.for('Get ID, username and password details for logged in user').resolvesWith({
          id: 123,
          name: 'logged-in-user',
          password: 'test07',
          passwordKey: 'password key'
        })
      })

      it('should not update password', function (done) {
        const requestData = {
          auth: {
            credentials: {
              name: 'logged-in-user'
            }
          }, payload: {
            newUsername: 'new-username',
            currentPassword: 'test07',
            newPassword: 'test07'
          }
        }
        endpointUtils.callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(function (response) {
            const updateUserDetails = dbSpy.query.withArgs('Save user details for currently logged in user').lastCall.returnValue.update.lastCall.args[0]
            assert.notOk(updateUserDetails.password)
            assert.isOk(updateUserDetails.name)
            assert.deepEqual(updateUserDetails, updateUserDetails, {
              updatedOn: now,
              updatedBy: 123,
              name: requestData.payload.newUsername
            })
          })
          .thenCall(done)
          .execute()
      })
    })

    describe('When the username is already in use by another user', function () {
      beforeEach(function () {
        dbSpy.query.for('Get ID, username and password details for logged in user').resolvesWith({
          id: 123,
          name: 'logged-in-user',
          password: 'test07',
          passwordKey: 'password key'
        })
        dbSpy.query.for('Get user object for username').resolvesWith({
          id: 321
        })
      })

      it('should response with 409 Conflict', function (done) {
        const requestData = {
          auth: {
            credentials: {
              name: 'logged-in-user'
            }
          }, payload: {
            newUsername: 'new-username',
            currentPassword: 'test07',
            newPassword: 'test07'
          }
        }
        endpointUtils.callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(function (response) {
            assert.equal(response.output.statusCode, 409)
            assert.deepEqual(response.output.payload, {
              statusCode: 409,
              error: 'Conflict',
              message: 'Username already in use'
            })
          })
          .thenCall(done)
          .execute()
      })
    })
  })
})
