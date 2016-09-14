let proxyquire = require('proxyquire')
let {assert} = require('chai')
let _ = require('lodash')
let sinon = require('sinon')

describe('auth endpoints', function () {
  let auth, knexStub

  describe('/auth POST', function () {
    describe('When the user can authenticate', function () {
      const requestData = {
        payload: {
          name: 'admin',
          password: 'test07',
          clientId: 'request client id'
        }
      }
      let auth, knexStub

      beforeEach(function () {
        knexStub = sinon.stub()
        knexStub.withArgs('user as u').returns({
          innerJoin: sinon.stub().returns({
            where: sinon.stub().returns({
              first: sinon.stub().returns(Promise.resolve({
                locked_out: 0,
                failed_password_attempts: 0,
                id: 123,
                name: 'admin',
                culture: 'en-US'
              }))
            })
          })
        })

        knexStub.withArgs('user').returns({
          where: sinon.stub().returns({
            update: sinon.stub().returns(Promise.resolve())
          })
        })

        knexStub.raw = sinon.stub().returns(Promise.resolve())

        knexStub.withArgs('role as r').returns({
          innerJoin: sinon.stub().returns({
            where: sinon.stub().returns({
              select: sinon.stub().returns(Promise.resolve([{name: 'admin'}, {name: 'readonly'}, {name: 'write'}]))
            })
          })
        })

        auth = proxyquire.noCallThru().load('./auth', {
          '../db': { knex: knexStub },
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
