let proxyquire = require('proxyquire')
let {assert} = require('chai')
let _ = require('lodash')
let endpointUtils = require('../../test/unit_tests/endpointUtils')

describe('auth endpoints', function () {
  let auth, dbStub
  const fakeConfig = { secret: '8rU7FITwHV30jhkcXvjOjoSvy2Tv2bZT', passwordAttempts: 5 }

  function setupAuthRoutes() {
    dbStub = require('../../test/unit_tests/dbStub')
    auth = proxyquire.noCallThru().load('./auth', {
      '../db': dbStub,
      '../config': fakeConfig
    })
  }

  describe('/auth GET', function () {
    beforeEach(function () {
      setupAuthRoutes()
    })

    it('Should respond with a welcome message for the API', function (done) {
      let endpoint = _.find(auth, {method: 'GET', path: '/auth'})
      endpointUtils.callHandlerOn(endpoint)
        .handleResponseWith(function (responseData) {
          assert.equal(responseData.message, 'Welcome to the API!')
        })
        .thenCall(done)
        .execute()
    })
  })

  describe('/auth POST', function () {
    describe('When the user can authenticate', function () {
      beforeEach(function () {
        setupAuthRoutes()
        dbStub.query.for('Get basic user details').resolvesWith({
          locked_out: 0,
          failed_password_attempts: 0,
          id: 123,
          name: 'admin',
          culture: 'en-US'
        })
        dbStub.query.for('Get roles for user').resolvesWith(
          [{name: 'admin'}, {name: 'readonly'}, {name: 'write'}]
        )
      })

      it('Should respond with a signed JSON web token, a refresh token id and the client id passed to it', function (done) {
        let endpoint = _.find(auth, {method: 'POST', path: '/auth'})
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

      it('Should create a client id is none is provided', function (done) {
        let endpoint = _.find(auth, {method: 'POST', path: '/auth'})
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
    })

    describe('When a user is not found', function () {
      beforeEach(function () {
        setupAuthRoutes()
        dbStub.query.for('Get basic user details').resolvesWith()
      })

      it('Should respond with 400 and "not found"', function (done) {
        let endpoint = _.find(auth, {method: 'POST', path: '/auth'})
        const requestData = {
          payload: {
            name: 'nonexistant',
            password: 'test07',
            clientId: 'request client id'
          }
        }
        endpointUtils.callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(function (responseData) {
            assert.equal(responseData.output.statusCode, 400)
            assert.equal(responseData.output.payload.message, 'not found')
          })
          .thenCall(done)
          .execute()
      })
    })

    describe('When the users account is locked', function () {
      beforeEach(function () {
        setupAuthRoutes()
        dbStub.query.for('Get basic user details').resolvesWith({
          locked_out: 1,
          failed_password_attempts: 0,
          id: 123,
          name: 'lockedaccount',
          culture: 'en-US'
        })
      })

      it('Should respond with 401 and "Your account is locked."', function (done) {
        let endpoint = _.find(auth, {method: 'POST', path: '/auth'})
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
      beforeEach(function () {
        setupAuthRoutes()
        dbStub.query.for('Get basic user details').resolvesWith({
          locked_out: 0,
          failed_password_attempts: 0,
          id: 123,
          name: 'admin',
          culture: 'en-US'
        })
      })

      it('Should respond with 401 and "Authentication failed. Wrong password."', function (done) {
        let endpoint = _.find(auth, {method: 'POST', path: '/auth'})
        const requestData = {
          payload: {
            name: 'admin',
            password: 'wrongpassword',
            clientId: 'request client id'
          }
        }
        endpointUtils.callHandlerOn(endpoint)
          .with(requestData)
          .handleResponseWith(function (responseData) {
            assert.equal(responseData.output.statusCode, 401)
            assert.equal(responseData.output.payload.message, 'Authentication failed. Wrong password.')
          })
          .thenCall(done)
          .execute()
      })
    })
  })

  describe('/auth/refresh POST', function () {
    describe('When a valid token exists', function () {
      beforeEach(function () {
        setupAuthRoutes()
        dbStub.query.for('Find existing token for client ID').resolvesWith({
          userId: 123,
          expires: new Date(new Date().getTime() + 7 * 86400000),
          name: 'admin',
          culture: 'en-US'
        })
      })

      it('Should respond with a signed JSON web token, a refresh token id and the client id passed to it', function (done) {
        let endpoint = _.find(auth, {method: 'POST', path: '/auth/refresh'})
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
        setupAuthRoutes()
        dbStub.query.for('Find existing token for client ID').resolvesWith()
      })

      it('Should respond with 400 and "Unable to find token or token revoked"', function (done) {
        let endpoint = _.find(auth, {method: 'POST', path: '/auth/refresh'})
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
        setupAuthRoutes()
        dbStub.query.for('Find existing token for client ID').resolvesWith({
          userId: 123,
          expires: new Date(new Date().getTime() - 1),
          name: 'admin',
          culture: 'en-US'
        })
      })

      it('Should respond with 400 and "Token expired"', function (done) {
        let endpoint = _.find(auth, {method: 'POST', path: '/auth/refresh'})
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
})
