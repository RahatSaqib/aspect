const chai = require('chai')
const proxyquire = require('proxyquire').noCallThru()
const sinon = require('sinon')

const { assert } = chai

describe('formData formFieldsService', () => {
  let getFormsByFormDefinitionExternalIdsStub
  let formsFileDictionaryStub
  let formFieldsService

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

  const buildRow = (data, overrides = {}) => ({
    id: 5,
    siteId: 15,
    partnerId: 91,
    siteName: 'Site A',
    resultId: null,
    sampleExternalId: 'sample-1',
    externalId: 'mobile-form-1',
    collectedOn: null,
    createdOn: '2026-03-10T00:00:00.000Z',
    updatedOn: '2026-03-10T00:00:00.000Z',
    data,
    ...overrides,
  })

  beforeEach(() => {
    getFormsByFormDefinitionExternalIdsStub = sinon.stub().resolves({ ClinicalResponse: formDefStub })
    formsFileDictionaryStub = {}
    formFieldsService = proxyquire('../../src/formData/formFieldsService', {
      '../forms/service': { getFormsByFormDefinitionExternalIds: getFormsByFormDefinitionExternalIdsStub },
      '../forms/formsFileDictionary': formsFileDictionaryStub,
    })
  })

  afterEach(() => {
    sinon.restore()
  })

  describe('parseRow', () => {
    it('parses a JSON string data column and spreads it onto the row', () => {
      const row = buildRow(JSON.stringify({ customFieldsData: [{ formDefinitionExternalId: 'ClinicalResponse' }] }))

      const parsed = formFieldsService.parseRow(row)

      assert.equal(parsed.id, 5)
      assert.deepEqual(parsed.customFieldsData, [{ formDefinitionExternalId: 'ClinicalResponse' }])
    })

    it('accepts an already-parsed data object from the DB layer', () => {
      const row = buildRow({ customFieldsData: [{ formDefinitionExternalId: 'ClinicalResponse', fields: {} }] })

      const parsed = formFieldsService.parseRow(row)

      assert.deepEqual(parsed.customFieldsData, [{ formDefinitionExternalId: 'ClinicalResponse', fields: {} }])
    })
  })

  describe('enrichWithFormFields', () => {
    it('resolves field titles and display values, dropping empty/unmatched fields', async () => {
      const parsedRow = formFieldsService.parseRow(
        buildRow(
          JSON.stringify({
            customFieldsData: [
              { formDefinitionExternalId: 'ClinicalResponse', fields: { 1101: 42, 1102: 'high', 1103: '' } },
            ],
          })
        )
      )

      const enriched = await formFieldsService.enrichWithFormFields(parsedRow, 91)

      assert.deepEqual(enriched.formFields, [
        { id: 1101, title: 'Patient Age', value: 42, controlType: 'text', fieldType: 'number', order: 1 },
        { id: 1102, title: 'Severity', value: 'High', controlType: 'comboBox', fieldType: 'string', order: 2 },
      ])
    })

    it('returns an empty formFields array when the row has no customFieldsData', async () => {
      const parsedRow = formFieldsService.parseRow(buildRow(JSON.stringify({ customFieldsData: [] })))

      const enriched = await formFieldsService.enrichWithFormFields(parsedRow, 91)

      assert.deepEqual(enriched.formFields, [])
      sinon.assert.notCalled(getFormsByFormDefinitionExternalIdsStub)
    })

    it('skips form field resolution when no partnerId is available', async () => {
      const parsedRow = formFieldsService.parseRow(
        buildRow(
          JSON.stringify({
            customFieldsData: [{ formDefinitionExternalId: 'ClinicalResponse', fields: { 1101: 42 } }],
          }),
          { partnerId: null }
        )
      )

      const enriched = await formFieldsService.enrichWithFormFields(parsedRow, null)

      assert.deepEqual(enriched.formFields, [])
      sinon.assert.notCalled(getFormsByFormDefinitionExternalIdsStub)
    })

    it('falls back to the formsFileDictionary when no form definition is resolved by partner', async () => {
      getFormsByFormDefinitionExternalIdsStub.resolves({})
      formsFileDictionaryStub.ClinicalResponse = formDefStub
      const parsedRow = formFieldsService.parseRow(
        buildRow(
          JSON.stringify({ customFieldsData: [{ formDefinitionExternalId: 'ClinicalResponse', fields: { 1101: 10 } }] })
        )
      )

      const enriched = await formFieldsService.enrichWithFormFields(parsedRow, 91)

      assert.deepEqual(enriched.formFields, [
        { id: 1101, title: 'Patient Age', value: 10, controlType: 'text', fieldType: 'number', order: 1 },
      ])
    })

    it('unwraps field values stored as { value } objects', async () => {
      const parsedRow = formFieldsService.parseRow(
        buildRow(
          JSON.stringify({
            customFieldsData: [
              {
                formDefinitionExternalId: 'ClinicalResponse',
                fields: [
                  { id: 1101, value: 'wrapped-value' },
                  { id: 1102, value: 'low' },
                ],
              },
            ],
          })
        )
      )

      const enriched = await formFieldsService.enrichWithFormFields(parsedRow, 91)

      assert.deepEqual(enriched.formFields, [
        { id: 1101, title: 'Patient Age', value: 'wrapped-value', controlType: 'text', fieldType: 'number', order: 1 },
        { id: 1102, title: 'Severity', value: 'Low', controlType: 'comboBox', fieldType: 'string', order: 2 },
      ])
    })
  })
})
