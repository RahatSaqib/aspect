let proxyquire = require('proxyquire')
let {assert} = require('chai')
let _ = require('lodash')
let dbStub = require('../../test/unit_tests/dbStub')
let endpointUtils = require('../../test/unit_tests/endpointUtils')

describe('auth endpoints', function () {
  let auth

  describe('/auth POST', function () {
    describe('When the user can authenticate', function () {
      const requestData = {
        payload: {
          name: 'admin',
          password: 'test07',
          clientId: 'request client id'
        }
      }

      beforeEach(function () {
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
        auth = proxyquire.noCallThru().load('./auth', {
          '../db': dbStub,
          '../config': { secret: '8rU7FITwHV30jhkcXvjOjoSvy2Tv2bZT', passwordAttempts: 5 }
        })
      })

      it('Should respond with a signed JSON web token, a refresh token id and the client id passed to it', function (done) {
        let endpoint = _.find(auth, {method: 'POST', path: '/auth'})

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
  })
})
