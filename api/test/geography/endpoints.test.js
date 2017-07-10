const proxyquire = require('proxyquire')
const { assert } = require('chai')
const _ = require('lodash')
const endpointUtils = require('../utils/endpointUtils')

describe('geography endpoints', () => {
  function setupRoute(method, path, serviceStub) {
    const endpoints = proxyquire('../../src/geography/endpoints', {
      './service': serviceStub,
    })
    return _.find(endpoints, { method, path })
  }

  describe('/geography/select-list', () => {
    describe('GET', () => {
      let endpoint
      const expectedResponse = ['List of Countries']

      beforeEach(() => {
        endpoint = setupRoute('GET', '/geography/select-list', {
          *buildGeographySelectList() {
            return expectedResponse
          },
        })
      })

      it('Should respond with a the data returned from the service', done => {
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

  describe('/geography/country-select-list', () => {
    describe('GET', () => {
      let endpoint
      const expectedResponse = ['List of Countries']

      beforeEach(() => {
        endpoint = setupRoute('GET', '/geography/country-select-list', {
          *countrySelectList() {
            return expectedResponse
          },
        })
      })

      it('Should respond with a the data returned from the service', done => {
        endpointUtils
          .callHandlerOn(endpoint)
          .with({ params: {} })
          .handleResponseWith(response => {
            assert.deepEqual(response, expectedResponse)
          })
          .thenCall(done)
          .execute()
      })
    })
  })

  describe('/geography/country-select-list/{countryId}', () => {
    describe('GET', () => {
      let endpoint
      const expectedResponse = ['List of Countries']

      beforeEach(() => {
        endpoint = setupRoute(
          'GET',
          '/geography/country-select-list/{countryId}',
          {
            *countrySelectList() {
              return expectedResponse
            },
          }
        )
      })

      it('Should respond with a the data returned from the service', done => {
        endpointUtils
          .callHandlerOn(endpoint)
          .with({ params: {} })
          .handleResponseWith(response => {
            assert.deepEqual(response, expectedResponse)
          })
          .thenCall(done)
          .execute()
      })
    })
  })

  describe('/geography/country-select-list/{countryId}/{stateId}', () => {
    describe('GET', () => {
      let endpoint
      const expectedResponse = ['List of Countries']

      beforeEach(() => {
        endpoint = setupRoute(
          'GET',
          '/geography/country-select-list/{countryId}/{stateId}',
          {
            *countrySelectList() {
              return expectedResponse
            },
          }
        )
      })

      it('Should respond with a the data returned from the service', done => {
        endpointUtils
          .callHandlerOn(endpoint)
          .with({ params: {} })
          .handleResponseWith(response => {
            assert.deepEqual(response, expectedResponse)
          })
          .thenCall(done)
          .execute()
      })
    })
  })

  describe('/geography/state-select-list/{countryId}', () => {
    describe('GET', () => {
      let endpoint
      const expectedResponse = ['List of States']

      beforeEach(() => {
        endpoint = setupRoute(
          'GET',
          '/geography/state-select-list/{countryId}',
          {
            *stateSelectList() {
              return expectedResponse
            },
          }
        )
      })

      it('Should respond with a the data returned from the service', done => {
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

  describe('/geography/lga-select-list/{stateId}', () => {
    describe('GET', () => {
      let endpoint
      const expectedResponse = ['List of LGAs']

      beforeEach(() => {
        endpoint = setupRoute('GET', '/geography/lga-select-list/{stateId}', {
          *lgaSelectList() {
            return expectedResponse
          },
        })
      })

      it('Should respond with a the data returned from the service', done => {
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
