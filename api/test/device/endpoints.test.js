const proxyquire = require('proxyquire')
const { assert } = require('chai')
const _ = require('lodash')
const endpointUtils = require('../utils/endpointUtils')

describe('device endpoints', () => {
  function setupRoute(method, path, serviceStub) {
    const endpoints = proxyquire('../../src/device/endpoints', {
      './service': serviceStub,
      './listDevicesForSelectList': serviceStub,
      './updateDevice': serviceStub,
      './listDevices': serviceStub,
      './getDevicePerformance': serviceStub,
    })
    return _.find(endpoints.routes, { method, path })
  }

  describe('GET', () => {
    describe('/device', () => {
      let endpoint
      const expectedResponse = { value: 'Expected result' }

      beforeEach(() => {
        endpoint = setupRoute('GET', '/device', {
          async listDevices() {
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

    describe('/device/{deviceId}', () => {
      let endpoint
      const expectedResponse = { value: 'Expected result' }

      beforeEach(() => {
        endpoint = setupRoute('GET', '/device/{deviceId}', {
          async showDevice() {
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
    describe('/device/performance/{deviceId}', () => {
      let endpoint
      const expectedResponse = { value: 'Expected result' }

      beforeEach(() => {
        endpoint = setupRoute('GET', '/device/performance/{deviceId}', {
          async getDevicePerformance() {
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

    describe('/device/approval-types', () => {
      let endpoint
      const expectedResponse = { value: 'Expected result' }

      beforeEach(() => {
        endpoint = setupRoute('GET', '/device/approval-types', {
          async listApprovalTypes() {
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
    describe('/device/select-list', () => {
      let endpoint
      const expectedResponse = { value: 'Expected result' }

      beforeEach(() => {
        endpoint = setupRoute('GET', '/device/select-list', {
          async listDevicesForSelectList() {
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
    describe('/device/{deviceId}', () => {
      let endpoint
      const expectedResponse = { value: 'Expected auth token' }

      beforeEach(() => {
        endpoint = setupRoute('PUT', '/device/{deviceId}', {
          async updateDevice() {
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

  describe('POST', () => {
    describe('/device/maintenance/{deviceId}', () => {
      let endpoint
      const expectedResponse = { value: 'Expected auth token' }

      beforeEach(() => {
        endpoint = setupRoute('POST', '/device/maintenance/{deviceId}', {
          async updateDeviceMaintenance() {
            return expectedResponse
          },
        })
      })
      it('Should respond with "Expected auth token" from the service, meaning such endpoint exists', done => {
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
