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
    const fakeKnex = () => ({
      where: () => ({
        update: async () => Promise.resolve(),
      }),
      insert: async () => Promise.resolve([123]),
    })

    return proxyquire(
      '../../../../src/deviceApiRaw/dataProcessors/truenatDevice/authenticate',
      {
        '../_base': {
          SynchronousDataProcessor: class {
            constructor(request, messageContext) {
              this.request = request
              this.messageContext = messageContext
            }
          },
        },
        '../../../shared/request': {
          getRemoteAddress: () => '10.11.12.13',
        },
        '../../../deviceApiKey/service': {
          authenticate: async () =>
            Promise.resolve(deviceApiKeyAuthenticateReturns),
        },
        '../../../db': {
          transact: async callback => Promise.resolve(callback(fakeKnex)),
        },
      }
    )
  }

  describe('canProcessRequest', () => {
    it('requires a path of /truelab/devices/login to be accepted', async () => {
      const TruenatLogin = mockTruenatLoginDataProcessor()
      let canProcessRequest = await TruenatLogin.canProcessRequest({ })
      assert.isFalse(canProcessRequest)
      canProcessRequest = await TruenatLogin.canProcessRequest({
        payload: { Username: 'test', Password: 'test' },
        params: 'some random array of params',
      })
      assert.isFalse(canProcessRequest)
      canProcessRequest = await TruenatLogin.canProcessRequest({
        params: 'truelab/devices/login',
      })
      assert.isTrue(canProcessRequest)
    })
  })

  describe('processRequest', () => {
    const request = {
      payload: { Username: 'test', Password: 'test' },
      params: {},
      plugins: { rawPayload: "{ Username: 'test', Password: 'test' }" },
    }
    const messageContext = { dispatch: () => {} }

    it('will set properties on the response', async () => {
      const TruenatLogin = mockTruenatLoginDataProcessor()
      const truenatLoginInstance = new TruenatLogin(request, messageContext)
      assert.isEmpty(truenatLoginInstance.response)
      await truenatLoginInstance.processRequest()
      assert.isNotEmpty(truenatLoginInstance.response)
    })
  })
})
