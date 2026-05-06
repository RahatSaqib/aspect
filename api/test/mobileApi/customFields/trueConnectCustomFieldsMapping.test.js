const chai = require('chai')
const proxyquire = require('proxyquire').noCallThru()
const sinon = require('sinon')

const { assert } = chai

describe('mobileApi customFields trueConnectCustomFieldsMapping', () => {
  afterEach(() => {
    sinon.restore()
  })

  function loadSubject({ getCustomFieldsFromPayloadStub }) {
    const formsByExternalId = {
      CustomFieldsBangladeshMtb: {
        fields: [
          {
            id: 1103,
            name: 'Gender',
            source: 'patientData.PatientGender',
            items: [
              { key: 1, value: 'Male' },
              { key: 0, value: 'Female' },
            ],
          },
          {
            id: 1104,
            name: 'Reason',
            source: 'patientData.Reason',
            items: [
              { key: 'new', value: 'New' },
              { key: 'follow-up', value: 'Follow-up' },
            ],
          },
          {
            id: 1105,
            name: 'FreeText',
            source: 'patientData.FreeText',
          },
        ],
      },
    }

    return proxyquire('../../../src/mobileApi/customFields/trueConnectCustomFieldsMapping', {
      '../../forms/service': {
        getFormsByFormDefinitionExternalIds: sinon.stub().resolves(formsByExternalId),
        getCustomFieldsFromPayload: getCustomFieldsFromPayloadStub,
      },
    })
  }

  it('maps TrueConnect option keys to GxConnect display values before using the shared mapper', async () => {
    const getCustomFieldsFromPayloadStub = sinon.stub().resolves({ patientData: { PatientGender: 'Male' } })
    const { getCustomFieldsFromTrueConnectFormData } = loadSubject({ getCustomFieldsFromPayloadStub })

    await getCustomFieldsFromTrueConnectFormData(
      [
        {
          formDefinitionExternalId: 'CustomFieldsBangladeshMtb',
          fields: {
            1103: 1,
          },
        },
      ],
      'BD',
      10,
      20,
      30
    )

    assert.isTrue(getCustomFieldsFromPayloadStub.calledOnce)
    const payload = getCustomFieldsFromPayloadStub.firstCall.args[0]
    assert.deepEqual(payload.data.customFieldData[1103], { key: 1, value: 'Male' })
  })

  it('keeps zero-valued option keys and converts them to their display values', async () => {
    const getCustomFieldsFromPayloadStub = sinon.stub().resolves({ patientData: { PatientGender: 'Female' } })
    const { getCustomFieldsFromTrueConnectFormData } = loadSubject({ getCustomFieldsFromPayloadStub })

    await getCustomFieldsFromTrueConnectFormData(
      [
        {
          formDefinitionExternalId: 'CustomFieldsBangladeshMtb',
          fields: {
            Gender: 0,
          },
        },
      ],
      'BD',
      10,
      20
    )

    const payload = getCustomFieldsFromPayloadStub.firstCall.args[0]
    assert.deepEqual(payload.data.customFieldData[1103], { key: 0, value: 'Female' })
    assert.deepEqual(getCustomFieldsFromPayloadStub.firstCall.args[5], { includeZeroAndFalse: true })
  })

  it('normalizes object values that carry an option key or key-like value', async () => {
    const getCustomFieldsFromPayloadStub = sinon.stub().resolves({ patientData: { Reason: 'Follow-up' } })
    const { getCustomFieldsFromTrueConnectFormData } = loadSubject({ getCustomFieldsFromPayloadStub })

    await getCustomFieldsFromTrueConnectFormData(
      [
        {
          formDefinitionExternalId: 'CustomFieldsBangladeshMtb',
          fields: {
            1104: { value: 'follow-up' },
          },
        },
      ],
      'BD',
      10,
      20
    )

    const payload = getCustomFieldsFromPayloadStub.firstCall.args[0]
    assert.deepEqual(payload.data.customFieldData[1104], { value: 'Follow-up', key: 'follow-up' })
  })

  it('passes through non-option values as GxConnect value objects', async () => {
    const getCustomFieldsFromPayloadStub = sinon.stub().resolves({ patientData: { FreeText: 'abc' } })
    const { getCustomFieldsFromTrueConnectFormData } = loadSubject({ getCustomFieldsFromPayloadStub })

    await getCustomFieldsFromTrueConnectFormData(
      [
        {
          formDefinitionExternalId: 'CustomFieldsBangladeshMtb',
          fields: {
            FreeText: 'abc',
          },
        },
      ],
      'BD',
      10,
      20
    )

    const payload = getCustomFieldsFromPayloadStub.firstCall.args[0]
    assert.deepEqual(payload.data.customFieldData[1105], { value: 'abc' })
  })
})
