const proxyquire = require('proxyquire')
const { assert } = require('chai')
const _ = require('lodash')
const sinon = require('sinon')
const endpointUtils = require('../utils/endpointUtils')

const validPassword = 'test07'
const validHashedPassword =
  '$2a$10$blGsMw08vX52YoZUnI18cOTluN170WvPJq1XApyif8Y2PuZThzK5K' // = test07

const {
  canViewSites,
  canViewDevices,
  canViewResults,
} = require('../../src/auth/constraints')

describe('auth endpoints', () => {
  let dbSpy
  let jwt
  let endpoint
  let templateProcessorFake
  let emailUtilFake
  const fakeConfig = {
    secret: '8rU7FITwHV30jhkcXvjOjoSvy2Tv2bZT',
    passwordAttempts: 5,
  }
  const now = new Date()
  const clock = sinon.useFakeTimers(now.getTime())
  const generatedEmail = {
    html: '<html><body><h1>Howdy!</h1></body></html>',
    text: 'Howdy!',
    subject: 'Hi There',
  }
  const inlineImageAttachments = [
    { value: 'This is an inline image to be inserted into the email' },
  ]

  const mockAuthObj = {
    credentials: {
      permissions: ['site:admin', 'device:admin', 'result:admin'],
    },
  }

  function setupAuthRoutes(method, path) {
    dbSpy = require('../utils/dbSpy')
    sinon.spy(dbSpy, 'query')
    jwt = require('jsonwebtoken')
    sinon.spy(jwt, 'sign')
    templateProcessorFake = {
      *process() {
        return yield Promise.resolve(generatedEmail)
      },
      *getInlineImageAttachments() {
        return yield Promise.resolve(inlineImageAttachments)
      },
    }
    sinon.spy(templateProcessorFake, 'process')
    sinon.spy(templateProcessorFake, 'getInlineImageAttachments')
    emailUtilFake = {
      *sendEmail() {
        return yield Promise.resolve()
      },
    }
    sinon.spy(emailUtilFake, 'sendEmail')
    const service = proxyquire.noCallThru().load('../../src/auth/service', {
      jsonwebtoken: jwt,
      '../db': dbSpy,
      '../config': fakeConfig,
      '../email/emailUtil': emailUtilFake,
      '../email/templateProcessor': templateProcessorFake,
    })
    const endpoints = proxyquire.noCallThru().load('../../src/auth/endpoints', {
      './service': service,
    })
    endpoint = _.find(endpoints, { method, path })
  }

  afterEach(() => {
    dbSpy.query.restore()
    jwt.sign.restore()
  })

  after(() => {
    clock.restore()
  })

  describe('/auth GET', () => {
    beforeEach(() => {
      setupAuthRoutes('GET', '/auth')
    })

    it('Should respond with a welcome message for the API', done => {
      endpointUtils
        .callHandlerOn(endpoint)
        .handleResponseWith(responseData => {
          assert.equal(responseData.message, 'Welcome to the API!')
        })
        .thenCall(done)
        .execute()
    })
  })

  describe('/auth POST', () => {
    beforeEach(() => {
      setupAuthRoutes('POST', '/auth')
    })

    describe('When the user can authenticate', () => {
      const permissions = [
        { module: 'device', activity: 'view' },
        { module: 'person', activity: 'view' },
        { module: 'site', activity: 'view' },
      ]
      beforeEach(() => {
        dbSpy.query.for('Get basic user details').resolvesWith({
          lockedOut: 0,
          failedPasswordAttempts: 0,
          id: 123,
          name: 'admin',
          culture: 'en-US',
          password: validHashedPassword,
        })
        dbSpy.query
          .for('Get permissions for user and partner')
          .resolvesWith(permissions)
      })

      it('Should be approved to view total sites, devices and result data', () => {
        assert.isTrue(canViewSites(mockAuthObj))
        assert.isTrue(canViewDevices(mockAuthObj))
        assert.isTrue(canViewResults(mockAuthObj))
      })

      it('Should respond with a signed JSON web token, a refresh token id and the client id passed to it', done => {
        const requestData = {
          payload: {
            name: 'admin',
            password: validPassword,
            clientId: 'request client id',
          },
        }
        endpointUtils
          .callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(responseData => {
            assert.isOk(responseData.access)
            assert.isOk(responseData.refresh)
            assert.equal(responseData.clientId, requestData.payload.clientId)
          })
          .thenCall(done)
          .execute()
      })

      it('Should create a client id if none is provided', done => {
        const requestData = {
          payload: {
            name: 'admin',
            password: validPassword,
            clientId: '',
          },
        }
        endpointUtils
          .callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(responseData => {
            assert.isOk(responseData.clientId)
          })
          .thenCall(done)
          .execute()
      })

      describe('getToken', () => {
        it("Should sign a token with the user's details", done => {
          const britishUser = {
            lockedOut: 0,
            failedPasswordAttempts: 0,
            id: 123,
            name: 'admin',
            password: validHashedPassword,
            culture: 'en-GB',
            timezone: 'GMT Standard Time',
            partnerId: 2,
            countryId: 3,
          }
          dbSpy.query.for('Get basic user details').resolvesWith(britishUser)
          const requestData = {
            payload: {
              name: 'admin',
              password: validPassword,
              clientId: 'request client id',
            },
          }
          endpointUtils
            .callHandlerOn(endpoint)
            .with(requestData)
            .handleResponseWith(() => {
              const unsignedToken = jwt.sign.lastCall.args[0]
              assert.deepEqual(unsignedToken, {
                name: britishUser.name,
                permissions: permissions.map(p => `${p.module}:${p.activity}`),
              })
            })
            .thenCall(done)
            .execute()
        })
      })
    })

    describe('When a user is not found', () => {
      beforeEach(() => {
        dbSpy.query.for('Get basic user details').resolvesWith()
      })

      it('Should respond with 401', done => {
        const requestData = {
          payload: {
            name: 'nonexistant',
            password: 'whatevs',
            clientId: 'request client id',
          },
        }
        endpointUtils
          .callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(responseData => {
            assert.equal(responseData.output.statusCode, 401)
          })
          .thenCall(done)
          .execute()
      })
    })

    describe('When the users account is locked', () => {
      beforeEach(() => {
        dbSpy.query.for('Get basic user details').resolvesWith({
          lockedOut: 1,
          failedPasswordAttempts: 0,
          id: 123,
          name: 'lockedaccount',
          password: 'whatevs',
          culture: 'en-US',
        })
      })

      it('Should respond with 401 and "Your account is locked."', done => {
        const requestData = {
          payload: {
            name: 'lockedaccount',
            password: validPassword,
            clientId: 'request client id',
          },
        }
        endpointUtils
          .callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(responseData => {
            assert.equal(responseData.output.statusCode, 401)
            assert.equal(
              responseData.output.payload.message,
              'Your account is locked.'
            )
          })
          .thenCall(done)
          .execute()
      })
    })

    describe('When the password is incorrect', () => {
      const requestData = {
        payload: {
          name: 'admin',
          password: 'wrongpassword',
          clientId: 'request client id',
        },
      }
      const basicUserDetails = {
        lockedOut: 0,
        failedPasswordAttempts: 0,
        id: 123,
        password: validHashedPassword,
        name: 'admin',
        culture: 'en-US',
      }
      beforeEach(() => {
        dbSpy.query.for('Get basic user details').resolvesWith(basicUserDetails)
      })

      it('Should increment the number of failed password attempts and respond with 401 and "Authentication failed. Wrong password."', done => {
        endpointUtils
          .callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(responseData => {
            assert.equal(responseData.output.statusCode, 401)
            assert.equal(
              responseData.output.payload.message,
              'Authentication failed. Wrong password.'
            )
            const updateFieldsOnUser = dbSpy.query.withArgs(
              'Update failed password attempts and set locked out status on user'
            ).lastCall.returnValue.update.lastCall.args[0]
            assert.equal(
              updateFieldsOnUser.failedPasswordAttempts,
              basicUserDetails.failedPasswordAttempts + 1
            )
          })
          .thenCall(done)
          .execute()
      })

      it('Should increment the number of failed password attempts and lock the user out after the maximum password attempts have been tried', done => {
        basicUserDetails.failedPasswordAttempts = 5
        endpointUtils
          .callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(() => {
            assert.isOk(
              dbSpy.query.calledWith(
                'Update failed password attempts and set locked out status on user'
              )
            )
            const updateFieldsOnUser = dbSpy.query.withArgs(
              'Update failed password attempts and set locked out status on user'
            ).lastCall.returnValue.update.lastCall.args[0]
            assert.equal(
              updateFieldsOnUser.failedPasswordAttempts,
              basicUserDetails.failedPasswordAttempts + 1
            )
            assert.equal(updateFieldsOnUser.lockedOut, 1)
          })
          .thenCall(done)
          .execute()
      })
    })
  })

  describe('/auth/refresh POST', () => {
    beforeEach(() => {
      setupAuthRoutes('POST', '/auth/refresh')
    })

    describe('When a valid token exists', () => {
      beforeEach(() => {
        dbSpy.query.for('Find existing token for client ID').resolvesWith({
          userId: 123,
          expires: new Date(new Date().getTime() + 7 * 86400000),
          name: 'admin',
          culture: 'en-US',
        })
      })

      it('Should respond with a signed JSON web token, a refresh token id and the client id passed to it', done => {
        const requestData = {
          payload: {
            clientId: 'request client id',
            token:
              'A+nmAmjiD0BqrZvfhrIRlnAoufJW0mhigNWa1Fnz/gl8JWsec4ochW9K5iaz3XcR',
          },
        }
        endpointUtils
          .callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(responseData => {
            assert.isOk(responseData.access)
            assert.isOk(responseData.refresh)
            assert.equal(responseData.clientId, requestData.payload.clientId)
          })
          .thenCall(done)
          .execute()
      })
    })

    describe('When no token is found', () => {
      beforeEach(() => {
        dbSpy.query.for('Find existing token for client ID').resolvesWith()
      })

      it('Should respond with 400 and "Unable to find token or token revoked"', done => {
        const requestData = {
          payload: {
            clientId: 'request client id',
            token:
              'A+nmAmjiD0BqrZvfhrIRlnAoufJW0mhigNWa1Fnz/gl8JWsec4ochW9K5iaz3XcR',
          },
        }
        endpointUtils
          .callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(responseData => {
            assert.equal(responseData.output.statusCode, 400)
            assert.equal(
              responseData.output.payload.message,
              'Unable to find token or token revoked'
            )
          })
          .thenCall(done)
          .execute()
      })
    })

    describe('When the token has expired', () => {
      beforeEach(() => {
        dbSpy.query.for('Find existing token for client ID').resolvesWith({
          userId: 123,
          expires: new Date(new Date().getTime() - 1),
          name: 'admin',
          culture: 'en-US',
        })
      })

      it('Should respond with 400 and "Token expired"', done => {
        const requestData = {
          payload: {
            clientId: 'request client id',
            token:
              'A+nmAmjiD0BqrZvfhrIRlnAoufJW0mhigNWa1Fnz/gl8JWsec4ochW9K5iaz3XcR',
          },
        }
        endpointUtils
          .callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(responseData => {
            assert.equal(responseData.output.statusCode, 400)
            assert.equal(responseData.output.payload.message, 'Token expired')
          })
          .thenCall(done)
          .execute()
      })
    })
  })

  describe('/auth/update-login-details PUT', () => {
    const validUserRecord = {
      lockedOut: false,
      failedPasswordAttempts: 0,
      password: validHashedPassword,
      legacyPassword: 0,
      id: 123,
      name: 'logged-in-user',
      culture: null,
      partnerId: 1,
      countryId: 1,
    }
    let requestData

    beforeEach(() => {
      setupAuthRoutes('PUT', '/auth/update-login-details')
      requestData = {
        auth: {
          credentials: {
            name: 'logged-in-user',
          },
        },
        payload: {
          newUsername: 'new-username',
          currentPassword: validPassword,
          newPassword: 'new-password',
          clientId: 'request client id',
        },
      }
      dbSpy.query.for('Get permissions for user and partner').resolvesWith([])
    })

    describe('When the user is changing both their username and password', () => {
      beforeEach(() => {
        dbSpy.query.for('Get basic user details').resolvesWith(validUserRecord)
      })

      it('should respond with a the list of fields that were updated', done => {
        endpointUtils
          .callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(response => {
            assert.isOk(response.ok)
            assert.include(response.data.changedFields, 'name')
            assert.include(response.data.changedFields, 'password')
            assert.notInclude(response.data.changedFields, 'updatedOn')
            assert.notInclude(response.data.changedFields, 'updatedBy')
          })
          .thenCall(done)
          .execute()
      })

      it("should save the user's details", done => {
        endpointUtils
          .callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(() => {
            const updateUserDetails = dbSpy.query.withArgs(
              'Update user details'
            ).lastCall.returnValue.update.lastCall.args[0]
            assert.isOk(updateUserDetails.password)
            assert.deepEqual(
              updateUserDetails,
              Object.assign(updateUserDetails, {
                lastPasswordChange: now,
                name: requestData.payload.newUsername,
              })
            )
          })
          .thenCall(done)
          .execute()
      })
    })

    describe('When the user is only changing their username', () => {
      beforeEach(() => {
        requestData.payload.newPassword = ''
        dbSpy.query.for('Get basic user details').resolvesWith(validUserRecord)
      })

      it('should respond with a the list of fields that were updated', done => {
        endpointUtils
          .callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(response => {
            assert.isOk(response.ok)
            assert.include(response.data.changedFields, 'name')
            assert.notInclude(response.data.changedFields, 'password')
          })
          .thenCall(done)
          .execute()
      })

      it("should save the user's username", done => {
        endpointUtils
          .callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(() => {
            const updateUserDetails = dbSpy.query.withArgs(
              'Update user details'
            ).lastCall.returnValue.update.lastCall.args[0]
            assert.notProperty(updateUserDetails, 'password')
            assert.deepEqual(updateUserDetails, {
              name: requestData.payload.newUsername,
            })
          })
          .thenCall(done)
          .execute()
      })
    })

    describe('When the user is only changing their password', () => {
      beforeEach(() => {
        requestData.payload.newUsername = ''
        dbSpy.query.for('Get basic user details').resolvesWith(validUserRecord)
      })

      it('should respond with a the list of fields that were updated', done => {
        endpointUtils
          .callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(response => {
            assert.isOk(response.ok)
            assert.notInclude(response.data.changedFields, 'name')
            assert.include(response.data.changedFields, 'password')
          })
          .thenCall(done)
          .execute()
      })

      it("should save the user's password", done => {
        endpointUtils
          .callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(() => {
            const updateUserDetails = dbSpy.query.withArgs(
              'Update user details'
            ).lastCall.returnValue.update.lastCall.args[0]
            assert.notProperty(updateUserDetails, 'username')
            assert.isOk(updateUserDetails.password)
            assert.deepEqual(
              updateUserDetails,
              Object.assign(updateUserDetails, {
                lastPasswordChange: now,
              })
            )
          })
          .thenCall(done)
          .execute()
      })
    })

    describe('When current password is incorrect', () => {
      beforeEach(() => {
        requestData.payload.currentPassword = 'incorrect-password'
        dbSpy.query.for('Get basic user details').resolvesWith(validUserRecord)
      })

      it('should respond 403 forbidden', done => {
        endpointUtils
          .callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(response => {
            assert.equal(response.output.statusCode, 403)
            assert.deepEqual(response.output.payload, {
              statusCode: 403,
              error: 'Forbidden',
              message: 'Incorrect password.',
            })
          })
          .thenCall(done)
          .execute()
      })
    })

    describe('When the user does not exist', () => {
      beforeEach(() => {
        dbSpy.query.for('Get basic user details').resolvesWith(undefined)
      })

      it('should respond 404 not found', done => {
        endpointUtils
          .callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(response => {
            assert.equal(response.output.statusCode, 404)
            assert.deepEqual(response.output.payload, {
              statusCode: 404,
              error: 'Not Found',
              message: 'User not Found',
            })
          })
          .thenCall(done)
          .execute()
      })
    })

    describe("When the username hasn't changed", () => {
      beforeEach(() => {
        requestData.payload.newUsername = 'logged-in-user'
        dbSpy.query.for('Get basic user details').resolvesWith(validUserRecord)
      })

      it('should not update username', done => {
        endpointUtils
          .callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(() => {
            const updateUserDetails = dbSpy.query.withArgs(
              'Update user details'
            ).lastCall.returnValue.update.lastCall.args[0]
            assert.isOk(updateUserDetails.password)
            assert.notOk(updateUserDetails.name)
            assert.deepEqual(
              updateUserDetails,
              Object.assign(updateUserDetails, {
                updatedOn: now,
                updatedBy: 123,
              })
            )
          })
          .thenCall(done)
          .execute()
      })
    })

    describe("When the password hasn't changed", () => {
      beforeEach(() => {
        requestData.payload.newPassword = validPassword
        dbSpy.query.for('Get basic user details').resolvesWith(validUserRecord)
      })

      it('should not update password', done => {
        endpointUtils
          .callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(() => {
            const updateUserDetails = dbSpy.query.withArgs(
              'Update user details'
            ).lastCall.returnValue.update.lastCall.args[0]
            assert.notOk(updateUserDetails.password)
            assert.isOk(updateUserDetails.name)
            assert.deepEqual(updateUserDetails, updateUserDetails, {
              updatedOn: now,
              updatedBy: 123,
              name: requestData.payload.newUsername,
            })
          })
          .thenCall(done)
          .execute()
      })
    })

    describe('When the username is already in use by another user', () => {
      beforeEach(() => {
        dbSpy.query.for('Get basic user details').resolvesWith(validUserRecord)
        dbSpy.query.for('Get user ID for username').resolvesWith({
          id: 321,
        })
      })

      it('should response with 409 Conflict', done => {
        endpointUtils
          .callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(response => {
            assert.equal(response.output.statusCode, 409)
            assert.deepEqual(response.output.payload, {
              statusCode: 409,
              error: 'Conflict',
              message: 'Username already in use',
            })
          })
          .thenCall(done)
          .execute()
      })
    })

    describe('token regeneration', () => {
      const permissions = [
        { module: 'device', activity: 'view' },
        { module: 'person', activity: 'view' },
        { module: 'site', activity: 'view' },
      ]

      beforeEach(() => {
        dbSpy.query.for('Get user ID for username').resolvesWith({
          id: 123,
        })
        dbSpy.query.for('Get basic user details').resolvesWith(validUserRecord)
        dbSpy.query
          .for('Get permissions for user and partner')
          .resolvesWith(permissions)
      })

      it('Should respond with a signed JSON web token, a refresh token id and the client id passed to it', done => {
        endpointUtils
          .callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(response => {
            assert.isOk(response.access)
            assert.isOk(response.refresh)
            assert.equal(response.clientId, requestData.payload.clientId)
          })
          .thenCall(done)
          .execute()
      })

      it('Should create a client id if none is provided', done => {
        requestData.payload.clientId = ''
        endpointUtils
          .callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(responseData => {
            assert.isOk(responseData.clientId)
          })
          .thenCall(done)
          .execute()
      })

      describe('getToken', () => {
        it("Should sign a token with the user's details", done => {
          const southAfricanUser = {
            lockedOut: 0,
            failedPasswordAttempts: 0,
            id: 123,
            name: 'admin',
            password: validHashedPassword,
            culture: 'en-ZA',
            timezone: 'South Africa Standard Time',
            partnerId: 2,
            countryId: 3,
          }
          dbSpy.query
            .for('Get basic user details')
            .resolvesWith(southAfricanUser)
          endpointUtils
            .callHandlerOn(endpoint)
            .with(requestData)
            .handleResponseWith(() => {
              const unsignedToken = jwt.sign.lastCall.args[0]
              assert.deepEqual(unsignedToken, {
                name: southAfricanUser.name,
                permissions: permissions.map(p => `${p.module}:${p.activity}`),
              })
            })
            .thenCall(done)
            .execute()
        })
      })
    })
  })

  describe('/auth/send-reset-password-token POST', () => {
    const requestData = {
      params: {
        email: 'email@example.com',
      },
    }

    beforeEach(() => {
      setupAuthRoutes('POST', '/auth/send-reset-password-token/{email}')
    })

    describe('when a single user exists with the email address provided', () => {
      const user = { id: 3, name: 'user-name', culture: 'fr-FR' }

      beforeEach(() => {
        dbSpy.query
          .for('Get user details from email address')
          .resolvesWith([user])
      })

      it('should respond with ok', done => {
        endpointUtils
          .callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(response => {
            assert.isOk(response.ok)
          })
          .thenCall(done)
          .execute()
      })

      it('should save a reset password token', done => {
        endpointUtils
          .callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(() => {
            const updateUserDetails = dbSpy.query.withArgs(
              'Save reset password token'
            ).lastCall.returnValue.update.lastCall.args[0]
            assert.isOk(updateUserDetails.resetPasswordToken)
            assert.equal(
              updateUserDetails.resetPasswordTokenExpires.toString(),
              new Date(now.getTime() + 3600000).toString()
            )
          })
          .thenCall(done)
          .execute()
      })

      it('should send an email with the user to the user', done => {
        endpointUtils
          .callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(() => {
            assert.equal(
              templateProcessorFake.process.lastCall.args[0],
              'resetPassword'
            )
            assert.equal(
              templateProcessorFake.process.lastCall.args[1].name,
              user.name
            )
            assert.isOk(
              templateProcessorFake.process.lastCall.args[1].resetPasswordToken
            )
            assert.equal(
              templateProcessorFake.process.lastCall.args[2],
              user.culture
            )
            assert.deepEqual(
              templateProcessorFake.getInlineImageAttachments.lastCall.args,
              [generatedEmail.html]
            )
            assert.deepEqual(emailUtilFake.sendEmail.lastCall.args, [
              requestData.params.email,
              generatedEmail.subject,
              generatedEmail.html,
              generatedEmail.text,
              inlineImageAttachments,
            ])
          })
          .thenCall(done)
          .execute()
      })
    })

    describe('when multiple users exist with the email address provided', () => {
      const users = [
        { id: 3, name: 'user-name', culture: 'fr-FR' },
        { id: 4, name: 'another-user-name', culture: 'en-US' },
      ]

      beforeEach(() => {
        dbSpy.query
          .for('Get user details from email address')
          .resolvesWith(users)
      })

      it('should respond with a conflict response', done => {
        endpointUtils
          .callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(response => {
            assert.equal(response.output.statusCode, 409)
            assert.deepEqual(response.output.payload, {
              statusCode: 409,
              error: 'Conflict',
              message:
                'Could not pinpoint the user from the email address provided',
            })
          })
          .thenCall(done)
          .execute()
      })
    })

    describe('when no users exist with the email address provided', () => {
      beforeEach(() => {
        dbSpy.query.for('Get user details from email address').resolvesWith([])
      })

      it("should respond with ok so that intruders can't use this endpoint to determine user details", done => {
        endpointUtils
          .callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(response => {
            assert.isOk(response.ok)
          })
          .thenCall(done)
          .execute()
      })
    })
  })

  describe('/auth/update-password PUT', () => {
    const requestData = {
      params: {
        resetPasswordToken: "this doesn't exist",
      },
      payload: {
        newPassword: 'New Password',
        clientName: 'Mocha/Chai',
        clientId: 'Client ID',
      },
    }

    beforeEach(() => {
      setupAuthRoutes('PUT', '/auth/update-password/{resetPasswordToken}')
    })

    describe("when reset password token doesn't exist", () => {
      beforeEach(() => {
        dbSpy.query
          .for('Get user with reset password token')
          .resolvesWith(undefined)
      })

      it('should respond with a 404 response', done => {
        endpointUtils
          .callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(response => {
            assert.equal(response.output.statusCode, 404)
            assert.deepEqual(response.output.payload, {
              statusCode: 404,
              error: 'Not Found',
              message: 'The reset password token was not found',
            })
          })
          .thenCall(done)
          .execute()
      })
    })

    describe('when reset password token has expired', () => {
      beforeEach(() => {
        const now = new Date()
        dbSpy.query.for('Get user with reset password token').resolvesWith({
          resetPasswordTokenExpires: new Date(now.getTime() - 1),
          id: 1,
          username: 'a-username',
        })
      })

      it('should respond with a 410 (Resource Gone) response', done => {
        endpointUtils
          .callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(response => {
            assert.equal(response.output.statusCode, 410)
            assert.deepEqual(response.output.payload, {
              statusCode: 410,
              error: 'Gone',
              message: 'The reset password token is no longer valid',
            })
          })
          .thenCall(done)
          .execute()
      })
    })

    describe('when reset password token is valid', () => {
      const userDetails = {
        resetPasswordTokenExpires: new Date(now.getTime() + 60000),
        id: 1,
        username: 'valid-username',
      }

      beforeEach(() => {
        dbSpy.query
          .for('Get user with reset password token')
          .resolvesWith(userDetails)
      })

      it('should respond with ok and the username', done => {
        endpointUtils
          .callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(response => {
            assert.deepEqual(response, {
              ok: true,
              username: userDetails.username,
            })
          })
          .thenCall(done)
          .execute()
      })

      it('should save the password details for the user', done => {
        endpointUtils
          .callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(() => {
            const updateUserDetails = dbSpy.query.withArgs(
              'Save password for user'
            ).lastCall.returnValue.update.lastCall.args[0]
            assert.equal(updateUserDetails.lockedOut, 0)
            assert.equal(updateUserDetails.failedPasswordAttempts, 0)
            assert.equal(updateUserDetails.legacyPassword, 0)
            assert.isOk(updateUserDetails.password)
            assert.equal(
              updateUserDetails.lastPasswordChange.toString(),
              now.toString()
            )
            assert.isNull(updateUserDetails.resetPasswordToken)
            assert.isNull(updateUserDetails.resetPasswordTokenExpires)
          })
          .thenCall(done)
          .execute()
      })
    })
  })
})
