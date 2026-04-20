const chai = require('chai')
const proxyquire = require('proxyquire').noCallThru()
const sinon = require('sinon')

const { assert } = chai

describe('formData service', () => {
  let getConstraintsStub
  let getFormsByFormDefinitionExternalIdsStub
  let countFormDataEntriesStub
  let getFormDataEntriesStub
  let getFormDataEntryByIdStub
  let formsFileDictionaryStub
  let service

  const buildRequest = ({ query = {}, params = {} } = {}) => ({
    query,
    params,
    auth: { credentials: { name: 'client-user' } },
  })

  const formDefStub = {
    fields: [
      { id: 1101, name: 'patientAge', title: 'Patient Age', controlType: 'text', fieldType: 'number', order: 1 },
      {
        id: 1102,
        name: 'severity',
        title: 'Severity',
        controlType: 'comboBox',
        fieldType: 'string',
        order: 2,
        items: [
          { key: 'low', value: 'Low' },
          { key: 'high', value: 'High' },
        ],
      },
      { id: 1103, name: 'notes', title: 'Notes', controlType: 'text', fieldType: 'string', order: 3 },
    ],
  }

  beforeEach(() => {
    getConstraintsStub = sinon.stub().resolves({ partner: { id: 91 } })
    getFormsByFormDefinitionExternalIdsStub = sinon.stub().resolves({ ClinicalResponse: formDefStub })
    countFormDataEntriesStub = sinon.stub().resolves({ total: '2' })
    getFormDataEntriesStub = sinon.stub().resolves([])
    getFormDataEntryByIdStub = sinon.stub().resolves(null)
    formsFileDictionaryStub = {}
    service = proxyquire('../../src/formData/service', {
      '../auth/constraints': { getConstraints: getConstraintsStub },
      '../forms/service': { getFormsByFormDefinitionExternalIds: getFormsByFormDefinitionExternalIdsStub },
      '../forms/formsFileDictionary': formsFileDictionaryStub,
      './db': {
        countFormDataEntries: countFormDataEntriesStub,
        getFormDataEntries: getFormDataEntriesStub,
        getFormDataEntryById: getFormDataEntryByIdStub,
      },
    })
  })

  afterEach(() => {
    sinon.restore()
  })

  describe('listFormDataEntries', () => {
    it('returns the standard list response shape with parsed rows and resolved form fields', async () => {
      getFormDataEntriesStub.resolves([
        {
          id: 5,
          siteId: 15,
          partnerId: 91,
          siteName: 'Site A',
          resultId: 77,
          resultEndedOn: '2026-02-01T00:00:00.000Z',
          sampleExternalId: 'sample-1',
          externalId: 'mobile-form-1',
          collectedOn: '2026-01-30T10:00:00.000Z',
          createdOn: '2026-01-30T10:05:00.000Z',
          updatedOn: '2026-01-30T10:05:00.000Z',
          data: JSON.stringify({
            customFieldsData: [
              {
                formDefinitionExternalId: 'ClinicalResponse',
                fields: { 1101: 42, 1102: 'high', 1103: '' },
              },
            ],
          }),
        },
      ])

      const response = await service.listFormDataEntries(buildRequest())

      assert.deepEqual(Object.keys(response), ['ok', 'total', 'length', 'data'])
      assert.isTrue(response.ok)
      assert.equal(response.total, 2)
      assert.equal(response.length, 1)
      assert.equal(response.data.length, 1)

      const [entry] = response.data
      assert.equal(entry.id, 5)
      assert.equal(entry.siteName, 'Site A')
      assert.deepEqual(entry.customFieldsData, [
        { formDefinitionExternalId: 'ClinicalResponse', fields: { 1101: 42, 1102: 'high', 1103: '' } },
      ])
      assert.deepEqual(entry.formFields, [
        { id: 1101, title: 'Patient Age', value: 42, controlType: 'text', fieldType: 'number', order: 1 },
        { id: 1102, title: 'Severity', value: 'High', controlType: 'comboBox', fieldType: 'string', order: 2 },
      ])
    })

    it('uses a 30-day default window when dateFrom and dateTo are not provided', async () => {
      const clock = sinon.useFakeTimers(new Date('2026-04-10T12:00:00.000Z').getTime())
      try {
        await service.listFormDataEntries(buildRequest())
      } finally {
        clock.restore()
      }

      sinon.assert.calledOnce(getFormDataEntriesStub)
      const filtersArg = getFormDataEntriesStub.firstCall.args[1]
      assert.equal(new Date(filtersArg.dateFrom).toISOString(), '2026-03-11T12:00:00.000Z')
      assert.equal(new Date(filtersArg.dateTo).toISOString(), '2026-04-10T12:00:00.000Z')
    })

    it('passes through explicit dateFrom, dateTo, siteId and sampleExternalId filters', async () => {
      const dateFrom = '2026-02-01T00:00:00.000Z'
      const dateTo = '2026-02-28T23:59:59.000Z'

      await service.listFormDataEntries(
        buildRequest({ query: { dateFrom, dateTo, siteId: 42, sampleExternalId: 'sample-xyz' } })
      )

      const filters = getFormDataEntriesStub.firstCall.args[1]
      assert.equal(filters.dateFrom, dateFrom)
      assert.equal(filters.dateTo, dateTo)
      assert.equal(filters.siteId, 42)
      assert.equal(filters.sampleExternalId, 'sample-xyz')
    })

    it('normalizes the matched query param: truthy/falsy strings and booleans', async () => {
      await service.listFormDataEntries(buildRequest({ query: { matched: 'true' } }))
      assert.strictEqual(getFormDataEntriesStub.lastCall.args[1].matched, true)

      await service.listFormDataEntries(buildRequest({ query: { matched: 'false' } }))
      assert.strictEqual(getFormDataEntriesStub.lastCall.args[1].matched, false)

      await service.listFormDataEntries(buildRequest({ query: { matched: true } }))
      assert.strictEqual(getFormDataEntriesStub.lastCall.args[1].matched, true)

      await service.listFormDataEntries(buildRequest({ query: { matched: false } }))
      assert.strictEqual(getFormDataEntriesStub.lastCall.args[1].matched, false)

      await service.listFormDataEntries(buildRequest({ query: {} }))
      assert.strictEqual(getFormDataEntriesStub.lastCall.args[1].matched, undefined)
    })

    it('returns an empty formFields array when the row has no customFieldsData', async () => {
      getFormDataEntriesStub.resolves([
        {
          id: 9,
          siteId: 15,
          partnerId: 91,
          siteName: 'Site A',
          resultId: null,
          sampleExternalId: null,
          externalId: null,
          collectedOn: null,
          createdOn: '2026-03-10T00:00:00.000Z',
          updatedOn: '2026-03-10T00:00:00.000Z',
          data: JSON.stringify({ customFieldsData: [] }),
        },
      ])

      const response = await service.listFormDataEntries(buildRequest())

      assert.deepEqual(response.data[0].formFields, [])
      sinon.assert.notCalled(getFormsByFormDefinitionExternalIdsStub)
    })

    it('skips form field resolution when no partnerId is available', async () => {
      getConstraintsStub.resolves({ partner: {} })
      getFormDataEntriesStub.resolves([
        {
          id: 10,
          siteId: 15,
          partnerId: null,
          siteName: 'Site A',
          resultId: null,
          sampleExternalId: null,
          externalId: null,
          collectedOn: null,
          createdOn: '2026-03-10T00:00:00.000Z',
          updatedOn: '2026-03-10T00:00:00.000Z',
          data: JSON.stringify({
            customFieldsData: [{ formDefinitionExternalId: 'ClinicalResponse', fields: { 1101: 42 } }],
          }),
        },
      ])

      const response = await service.listFormDataEntries(buildRequest())

      assert.deepEqual(response.data[0].formFields, [])
      sinon.assert.notCalled(getFormsByFormDefinitionExternalIdsStub)
    })

    it('falls back to the formsFileDictionary when no form definition is resolved by partner', async () => {
      getFormsByFormDefinitionExternalIdsStub.resolves({})
      formsFileDictionaryStub.ClinicalResponse = formDefStub
      getFormDataEntriesStub.resolves([
        {
          id: 11,
          siteId: 15,
          partnerId: 91,
          siteName: 'Site A',
          resultId: null,
          sampleExternalId: null,
          externalId: null,
          collectedOn: null,
          createdOn: '2026-03-10T00:00:00.000Z',
          updatedOn: '2026-03-10T00:00:00.000Z',
          data: JSON.stringify({
            customFieldsData: [{ formDefinitionExternalId: 'ClinicalResponse', fields: { 1101: 10 } }],
          }),
        },
      ])

      const response = await service.listFormDataEntries(buildRequest())

      assert.deepEqual(response.data[0].formFields, [
        { id: 1101, title: 'Patient Age', value: 10, controlType: 'text', fieldType: 'number', order: 1 },
      ])
    })

    it('accepts already-parsed JSON data objects from the DB layer', async () => {
      getFormDataEntriesStub.resolves([
        {
          id: 12,
          siteId: 15,
          partnerId: 91,
          siteName: 'Site A',
          resultId: null,
          sampleExternalId: null,
          externalId: null,
          collectedOn: null,
          createdOn: '2026-03-10T00:00:00.000Z',
          updatedOn: '2026-03-10T00:00:00.000Z',
          data: {
            customFieldsData: [{ formDefinitionExternalId: 'ClinicalResponse', fields: { 1101: 'hello' } }],
          },
        },
      ])

      const response = await service.listFormDataEntries(buildRequest())

      assert.deepEqual(response.data[0].customFieldsData, [
        { formDefinitionExternalId: 'ClinicalResponse', fields: { 1101: 'hello' } },
      ])
      assert.equal(response.data[0].formFields[0].value, 'hello')
    })

    it('unwraps field values stored as { value } objects', async () => {
      getFormDataEntriesStub.resolves([
        {
          id: 13,
          siteId: 15,
          partnerId: 91,
          siteName: 'Site A',
          resultId: null,
          sampleExternalId: null,
          externalId: null,
          collectedOn: null,
          createdOn: '2026-03-10T00:00:00.000Z',
          updatedOn: '2026-03-10T00:00:00.000Z',
          data: JSON.stringify({
            customFieldsData: [
              {
                formDefinitionExternalId: 'ClinicalResponse',
                fields: [
                  { id: 1101, value: 'wrapped-value' },
                  { id: 1102, value: 'low' },
                ],
              },
            ],
          }),
        },
      ])

      const response = await service.listFormDataEntries(buildRequest())

      assert.deepEqual(response.data[0].formFields, [
        { id: 1101, title: 'Patient Age', value: 'wrapped-value', controlType: 'text', fieldType: 'number', order: 1 },
        { id: 1102, title: 'Severity', value: 'Low', controlType: 'comboBox', fieldType: 'string', order: 2 },
      ])
    })

    it('coerces a null count row total to 0', async () => {
      countFormDataEntriesStub.resolves({ total: null })

      const response = await service.listFormDataEntries(buildRequest())

      assert.equal(response.total, 0)
    })
  })

  describe('showFormDataEntry', () => {
    it('returns the parsed row enriched with formFields', async () => {
      getFormDataEntryByIdStub.resolves({
        id: 5,
        siteId: 15,
        partnerId: 91,
        siteName: 'Site A',
        resultId: null,
        sampleExternalId: 'sample-1',
        externalId: 'mobile-form-1',
        collectedOn: '2026-01-30T10:00:00.000Z',
        createdOn: '2026-01-30T10:05:00.000Z',
        updatedOn: '2026-01-30T10:05:00.000Z',
        data: JSON.stringify({
          customFieldsData: [{ formDefinitionExternalId: 'ClinicalResponse', fields: { 1102: 'low' } }],
        }),
      })

      const response = await service.showFormDataEntry(buildRequest({ params: { id: 5 } }))

      sinon.assert.calledWithExactly(getFormDataEntryByIdStub, sinon.match.any, 5)
      assert.isTrue(response.ok)
      assert.equal(response.data.id, 5)
      assert.deepEqual(response.data.formFields, [
        { id: 1102, title: 'Severity', value: 'Low', controlType: 'comboBox', fieldType: 'string', order: 2 },
      ])
    })

    it('throws a 404 Boom error when the entry does not exist', async () => {
      getFormDataEntryByIdStub.resolves(null)

      try {
        await service.showFormDataEntry(buildRequest({ params: { id: 999 } }))
        assert.fail('Expected Boom.notFound error')
      } catch (error) {
        assert.equal(error.output.statusCode, 404)
        assert.equal(error.message, 'FormData entry not found.')
      }
    })
  })
})
