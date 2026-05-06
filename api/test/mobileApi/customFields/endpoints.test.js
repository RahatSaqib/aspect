const proxyquire = require('proxyquire')
const { assert } = require('chai')
const _ = require('lodash')
const endpointUtils = require('../../utils/endpointUtils')

describe('mobileApi customFields endpoints', () => {
  function setupRoute(method, path, customFieldsServiceStub = {}, customFieldsHandlersStub = {}) {
    const endpoints = proxyquire('../../../src/mobileApi/customFields/endpoints', {
      './service': customFieldsServiceStub,
      './upsertFormData': { upsertFormData: customFieldsHandlersStub.upsertFormData },
      './listForms': { listForms: customFieldsHandlersStub.listForms },
      './getFormDataByExternalId': { getFormDataByExternalId: customFieldsHandlersStub.getFormDataByExternalId },
    })

    return _.find(endpoints.routes, { method, path })
  }

  it('should expose GET /v4/custom-fields/{externalId}', done => {
    const expectedResponse = { ok: true, data: { externalId: 'mobile-form-1' } }
    const endpoint = setupRoute(
      'GET',
      '/v4/custom-fields/{externalId}',
      {},
      {
        getFormDataByExternalId: async () => expectedResponse,
      }
    )

    endpointUtils
      .callHandlerOn(endpoint)
      .with({ params: { externalId: 'mobile-form-1' }, auth: { credentials: {} } })
      .handleResponseWith(response => {
        assert.deepEqual(response, expectedResponse)
      })
      .thenCall(done)
      .execute()
  })
})
