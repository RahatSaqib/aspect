const chai = require('chai')
const proxyquire = require('proxyquire')
const Promise = require('bluebird')
const sinon = require('sinon')

const { deviceSeen } = require('../../../../src/device/actions')

const { assert, expect } = chai

describe('Truenat Authenticate Data Processor', () => {
  let mockSharedRequestService
  let mockDeviceApiKeyService
  function mockTruenatLoginDataProcessor(
    deviceApiKeyLookupUsingCredentialsReturns = {
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
        password: '$1a$12$Te5t0/HaShed000000/PaSsW0rD01234567890123456789012345',
        expiresOn: new Date().getTime() - 1000 * 10,
      },
    }
  ) {
    mockSharedRequestService = {
      getRemoteAddress: () => '10.11.12.13',
    }
    sinon.spy(mockSharedRequestService, 'getRemoteAddress')
    mockDeviceApiKeyService = {
      lookupUsingCredentials: async () => Promise.resolve(deviceApiKeyLookupUsingCredentialsReturns),
    }
    sinon.spy(mockDeviceApiKeyService, 'lookupUsingCredentials')
    return proxyquire('../../../../src/deviceApiRaw/dataProcessors/truenatDevice/authenticate', {
      '../_base': {
        SynchronousDataProcessor: class {
          constructor(request, messageContext) {
            this.request = request
            this.messageContext = messageContext
          }

          async updateDeviceLastSeenOn() {
            return Promise.resolve()
          }
        },
      },
      '../../../shared/request': mockSharedRequestService,
      '../../../deviceApiKey/lookupUsingCredentials': mockDeviceApiKeyService,
    })
  }

  describe('canProcessRequest', () => {
    it('requires a path of /truelab/devices/login to be accepted', async () => {
      const TruenatLogin = mockTruenatLoginDataProcessor()
      let canProcessRequest = await TruenatLogin.canProcessRequest({})
      assert.isFalse(canProcessRequest)
      canProcessRequest = await TruenatLogin.canProcessRequest({
        payload: { Username: 'test', Password: 'test' },
        params: 'some random array of params',
      })
      assert.isFalse(canProcessRequest)
      canProcessRequest = await TruenatLogin.canProcessRequest({
        params: { params: 'truelab/devices/login' },
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
    let messageContext
    beforeEach(() => {
      messageContext = { dispatch: () => {} }
      sinon.spy(messageContext, 'dispatch')
    })

    it('will mutate the response', async () => {
      const TruenatLogin = mockTruenatLoginDataProcessor()
      const truenatLoginInstance = new TruenatLogin(request, messageContext)
      assert.isEmpty(truenatLoginInstance.response)
      await truenatLoginInstance.processRequest()
      assert.isNotEmpty(truenatLoginInstance.response)
    })

    it('will attempt to lookup device API key using the username & password sent in the request', async () => {
      const TruenatLogin = mockTruenatLoginDataProcessor()
      const truenatLoginInstance = new TruenatLogin(request, messageContext)
      await truenatLoginInstance.processRequest()
      assert.isOk(mockDeviceApiKeyService.lookupUsingCredentials.calledOnce)
    })

    describe('when credentials match a device API key', () => {
      it('will dispatch the device seen action', async () => {
        const TruenatLogin = mockTruenatLoginDataProcessor()
        const truenatLoginInstance = new TruenatLogin(request, messageContext)
        await truenatLoginInstance.processRequest()
        assert.isOk(messageContext.dispatch.calledOnce)
        const deviceApiKeyLookupRevolvedValue = await mockDeviceApiKeyService.lookupUsingCredentials.lastCall
          .returnValue
        const {
          data: { deviceId },
        } = deviceApiKeyLookupRevolvedValue
        assert.isOk(messageContext.dispatch.calledWith(deviceSeen(deviceId)))
      })

      it('will respond with the device API key details', async () => {
        const TruenatLogin = mockTruenatLoginDataProcessor()
        const truenatLoginInstance = new TruenatLogin(request, messageContext)
        await truenatLoginInstance.processRequest()
        const credentialLookupSpy = mockDeviceApiKeyService.lookupUsingCredentials.lastCall
        const deviceApiKeyLookupRevolvedValue = await credentialLookupSpy.returnValue
        const {
          data: { token },
        } = deviceApiKeyLookupRevolvedValue
        const username = request.payload.Username
        assert.deepEqual(truenatLoginInstance.response, {
          username,
          token: `Bearer ${token}`,
          success: true,
        })
      })
    })

    describe('when password does not match device API key credentials', () => {
      it('will respond with 401', async () => {
        const TruenatLogin = mockTruenatLoginDataProcessor({
          authenticated: false,
          reason: 'invalid',
          data: {},
        })
        const truenatLoginInstance = new TruenatLogin(request, messageContext)
        try {
          await truenatLoginInstance.processRequest()
          assert.fail('401 Response not returned!')
        } catch (e) {
          expect(e).to.containSubset({
            output: {
              statusCode: 401,
              payload: {
                statusCode: 401,
                error: 'Unauthorized',
                message: `{"username":"${request.payload.Username}","success":false}`,
              },
            },
          })
        }
      })

      it('will reject without side effects on failed auth', async () => {
        const TruenatLogin = mockTruenatLoginDataProcessor({
          authenticated: false,
          reason: 'invalid',
          data: {},
        })
        const truenatLoginInstance = new TruenatLogin(request, messageContext)
        await expect(truenatLoginInstance.processRequest()).to.be.rejectedWith(
          `{"username":"${request.payload.Username}","success":false}`
        )
      })

      it('will NOT dispatch the device seen action', async () => {
        const TruenatLogin = mockTruenatLoginDataProcessor({
          authenticated: false,
          reason: 'invalid',
          data: {},
        })
        const truenatLoginInstance = new TruenatLogin(request, messageContext)
        await expect(truenatLoginInstance.processRequest()).to.be.rejectedWith(
          `{"username":"${request.payload.Username}","success":false}`
        )
        assert.isNotOk(messageContext.dispatch.called)
      })
    })
  })
})
