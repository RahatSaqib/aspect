const proxyquire = require('proxyquire')
const { assert } = require('chai')
const _ = require('lodash')
const endpointUtils = require('../utils/endpointUtils')

describe('consumable endpoints', () => {
  function setupRoute(method, path, serviceStub) {
    const endpoints = proxyquire('../../src/consumable/endpoints', {
      './service': serviceStub,
    })
    return _.find(endpoints, { method, path })
  }

  describe('GET', () => {
    describe('/inventory/consumable-types', () => {
      let endpoint
      const expectedResponse = { value: 'Expected consumable types' }

      beforeEach(() => {
        endpoint = setupRoute('GET', '/inventory/consumable-types', {
          *listConsumableTypes() {
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

    describe('/inventory/consumable-reason', () => {
      let endpoint
      const expectedResponse = { value: 'Expected consumable reasons' }

      beforeEach(() => {
        endpoint = setupRoute('GET', '/inventory/consumable-reason', {
          *listConsumableReasons() {
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

    describe('/consumable-assays/{consumableId}', () => {
      let endpoint
      const expectedResponse = { value: 'Expected consumable quantities' }

      beforeEach(() => {
        endpoint = setupRoute('GET', '/consumable-assays/{consumableId}', {
          *getConsumableAssays() {
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

    describe('/assay-consumables/{assayId}', () => {
      let endpoint
      const expectedResponse = { value: 'Expected consumable' }

      beforeEach(() => {
        endpoint = setupRoute('GET', '/assay-consumables/{assayId}', {
          *getAssayConsumables() {
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
    describe('/assay-consumable/{assayId}/{consumableId}', () => {
      let endpoint
      const expectedResponse = { value: 'Expected result' }

      beforeEach(() => {
        endpoint = setupRoute(
          'PUT',
          '/assay-consumable/{assayId}/{consumableId}',
          {
            *updateAssayConsumableQuantity() {
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
    describe('/assay-consumable', () => {
      let endpoint
      const expectedResponse = { value: 'Expected result' }

      beforeEach(() => {
        endpoint = setupRoute('POST', '/assay-consumable', {
          *createAssayConsumable() {
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

  describe('DELETE', () => {
    describe('/assay-consumable/{assayId}/{consumableId}', () => {
      let endpoint
      const expectedResponse = { value: 'Expected result' }

      beforeEach(() => {
        endpoint = setupRoute(
          'DELETE',
          '/assay-consumable/{assayId}/{consumableId}',
          {
            *deleteAssayConsumable() {
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
