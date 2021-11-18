const chai = require('chai')
const proxyquire = require('proxyquire')
const Promise = require('bluebird')

const { assert } = chai

describe('Truenat Authenticate Data Processor', () => {
  function mockTruenatLoginDataProcessor(
    deviceApiKeyAuthenticateReturns = {
      authenticated: true,
      data: {
        id: 123,
        token: 'nrqsc0o9wbkfn6xcshn1',
        revoked: 0,
        partnerId: 1,
        geographyId: null,
        siteId: null,
        deviceId: 321,
        createdOn: new Date(2021, 11, 17, 14, 16, 53),
        createdBy: 1,
        updatedOn: new Date(2021, 11, 17, 14, 16, 53),
        updatedBy: 1,
        username: 'admin',
        password:
          '$1a$12$Te5t0/HaShed000000/PaSsW0rD01234567890123456789012345',
        ttl: new Date().getTime() - 1000 * 10,
      },
    }
  ) {
    return proxyquire(
      '../../../../src/deviceApiRaw/dataProcessors/truenatDevice/authenticate',
      {
        '../_base': {
          authenticate: async () =>
            Promise.resolve(deviceApiKeyAuthenticateReturns),
        },
        '../../../deviceApiKey/service': {
          authenticate: async () =>
            Promise.resolve(deviceApiKeyAuthenticateReturns),
        },
      }
    )
  }

  describe('canProcessRequest', () => {
    it('requires a path of /truelab/devices/login plus a username and password to be sent', () => {
      const TruenatLogin = mockTruenatLoginDataProcessor()
      assert.isFalse(TruenatLogin.canProcessRequest({ payload: {}, params: {} }))
      assert.isFalse(TruenatLogin.canProcessRequest({ payload: { Username: 'test' }, params: {} }))
      assert.isFalse(TruenatLogin.canProcessRequest({ payload: { Username: 'test', Password: '' }, params: {} }))
      assert.isFalse(TruenatLogin.canProcessRequest({ payload: { Username: 'test', Password: 'test' }, params: {} }))
    })
  })

  describe('processRequest', () => {
    const request = { payload: { Username: 'test', Password: 'test' }, params: {} }
    it('requires a username and password to be sent', () => {
      const TruenatLogin = mockTruenatLoginDataProcessor()
      const truenatLoginInstance = new TruenatLogin(request)
      assert.isFalse(TruenatLogin.canProcessRequest({ payload: {}, params: {} }))
      assert.isFalse(TruenatLogin.canProcessRequest({ payload: { Username: 'test' }, params: {} }))
      assert.isFalse(TruenatLogin.canProcessRequest({ payload: { Username: 'test', Password: '' }, params: {} }))
      assert.isFalse(TruenatLogin.canProcessRequest({ payload: { Username: 'test', Password: 'test' }, params: {} }))
    })
  })
})
