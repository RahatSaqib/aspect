const proxyquire = require('proxyquire')
const { assert } = require('chai')
const _ = require('lodash')
const endpointUtils = require('../utils/endpointUtils')

describe('auth endpoints', () => {
  function setupRoute(method, path, serviceStub) {
    const endpoints = proxyquire('../../src/auth/endpoints', {
      './service': serviceStub,
    })
    return _.find(endpoints.routes, { method, path })
  }

  describe('GET', () => {
    describe('/auth', () => {
      let endpoint
      const expectedResponse = { value: 'Expected auth token' }

      beforeEach(() => {
        endpoint = setupRoute('GET', '/auth', {
          async checkAuthentication() {
            return expectedResponse
          },
        })
      })
      it('Should respond with the data returned from the service', done => {
        endpointUtils
          .callHandlerOn(endpoint)
          .handleResponseWith(response => {
            assert.deepEqual(response, expectedResponse)
          })
          .thenCall(done)
          .execute()
      })
    })
  })

  describe('PUT', () => {
    describe('/auth/update-login-details', () => {
      let endpoint
      const expectedResponse = { value: 'Expected auth token' }

      beforeEach(() => {
        endpoint = setupRoute('PUT', '/auth/update-login-details', {
          async updateUsernameAndPasswordForLoggedInUser() {
            return expectedResponse
          },
        })
      })
      it('Should respond with the data returned from the service', done => {
        endpointUtils
          .callHandlerOn(endpoint)
          .handleResponseWith(response => {
            assert.deepEqual(response, expectedResponse)
          })
          .thenCall(done)
          .execute()
      })
    })

    describe('/auth/update-password/{resetPasswordToken}', () => {
      let endpoint
      const expectedResponse = { value: 'Expected auth token' }

      beforeEach(() => {
        endpoint = setupRoute(
          'PUT',
          '/auth/update-password/{resetPasswordToken}',
          {
            async updatePasswordWithResetPasswordToken() {
              return expectedResponse
            },
          }
        )
      })
      it('Should respond with the data returned from the service', done => {
        endpointUtils
          .callHandlerOn(endpoint)
          .handleResponseWith(response => {
            assert.deepEqual(response, expectedResponse)
          })
          .thenCall(done)
          .execute()
      })
    })

    describe('/auth/update-person-login-details/{personId}', () => {
      let endpoint
      const expectedResponse = { value: 'Expected auth token' }

      beforeEach(() => {
        endpoint = setupRoute(
          'PUT',
          '/auth/update-person-login-details/{personId}',
          {
            async updateUsernameAndPasswordForPerson() {
              return expectedResponse
            },
          }
        )
      })
      it('Should respond with the data returned from the service', done => {
        endpointUtils
          .callHandlerOn(endpoint)
          .handleResponseWith(response => {
            assert.deepEqual(response, expectedResponse)
          })
          .thenCall(done)
          .execute()
      })
    })
  })

  describe('POST', () => {
    describe('/auth', () => {
      let endpoint
      const expectedResponse = { value: 'Expected auth token' }

      beforeEach(() => {
        endpoint = setupRoute('POST', '/auth', {
          async authenticate() {
            return expectedResponse
          },
        })
      })
      it('Should respond with the data returned from the service', done => {
        endpointUtils
          .callHandlerOn(endpoint)
          .handleResponseWith(response => {
            assert.deepEqual(response, expectedResponse)
          })
          .thenCall(done)
          .execute()
      })
    })

    describe('/auth/refresh', () => {
      let endpoint
      const expectedResponse = { value: 'Expected auth token' }

      beforeEach(() => {
        endpoint = setupRoute('POST', '/auth/refresh', {
          async refreshToken() {
            return expectedResponse
          },
        })
      })
      it('Should respond with the data returned from the service', done => {
        endpointUtils
          .callHandlerOn(endpoint)
          .handleResponseWith(response => {
            assert.deepEqual(response, expectedResponse)
          })
          .thenCall(done)
          .execute()
      })
    })

    describe('/auth/send-reset-password-token/{email}', () => {
      let endpoint
      const expectedResponse = { value: 'Expected auth token' }

      beforeEach(() => {
        endpoint = setupRoute(
          'POST',
          '/auth/send-reset-password-token/{email}',
          {
            async createResetPasswordToken() {
              return expectedResponse
            },
          }
        )
      })
      it('Should respond with the data returned from the service', done => {
        endpointUtils
          .callHandlerOn(endpoint)
          .handleResponseWith(response => {
            assert.deepEqual(response, expectedResponse)
          })
          .thenCall(done)
          .execute()
      })
    })
  })
})
