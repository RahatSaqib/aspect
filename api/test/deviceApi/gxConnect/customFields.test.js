const { assert } = require('chai')
const mapGxConnectCustomFields = require('../../../src/plugin/deviceType/GxConnect/customFields/customFieldsMappingTemplates')
const aspectFields = require('./customFieldsForm.json')
const mappingResult = require('./mappingResult.json')

describe.only('Custom field mapper', () => {
  it('it generates the mapping between aspect dynamic forms and gxconnect expected json', () => {
    const mappingOutput = mapGxConnectCustomFields(aspectFields)
    // we are going to validate the right mapping
    assert.deepEqual(mappingOutput, mappingResult)
  })

  it('should transform a number field', () => {
    const numberExample = {
      fields: [
        {
          id: 2,
          name: 'PlainField',
          i18nKey: 'PlainFieldi18nKey',
          fieldType: 'number',
          order: 1,
          caption: 'PlainField value',
          i18nKeyCaption: 'PlainFieldi18nCaptionKey',
          controlType: 'textBox',
        },
      ],
    }
    const mappingOutput = mapGxConnectCustomFields(numberExample)
    assert.deepEqual(mappingOutput.CustomFields.Fields, [
      {
        Id: 2,
        Name: 'PlainField',
        Help: 'PlainField value',
        Optional: true,
        Control: 'TextBox',
        Type: 'string',
        DisplayOrder: 1,
        InputControlData: {},
      },
    ])
  })
  it.only('it should map display conditions', () => {
    const displayConditionalExample = {
      fields: [
        {
          id: 2,
          name: 'PlainField',
          i18nKey: 'PlainFieldi18nKey',
          fieldType: 'text',
          order: 1,
          caption: 'PlainField value',
          i18nKeyCaption: 'PlainFieldi18nCaptionKey',
          controlType: 'textBox',
        },
        {
          name: 'ConditionalField',
          i18nKey: 'ConditionalFieldi18nKey',
          fieldType: 'text',
          order: 0,
          caption: 'ConditionalField value',
          i18nKeyCaption: 'ConditionalFieldi18nCaptionKey',
          controlType: 'textBox',
          condition: [
            {
              conjunction: 'AND',
              propToCompare: 'PlainField',
              valueToCompare: 'unknown',
              operator: '!==',
              conjunctionGroupName: 'PlainFieldCollectionGroup',
            },
          ],
        },
      ],
    }
    const mappingOutput = mapGxConnectCustomFields(displayConditionalExample)
    assert.deepEqual(mappingOutput, {
      CustomFields: {
        Fields: [
          {
            Id: 2,
            Name: 'PlainField',
            Help: 'PlainField value',
            Optional: true,
            Control: 'TextBox',
            Type: 'string',
            DisplayOrder: 1,
            InputControlData: {},
          },
          {
            Name: 'ConditionalField',
            Help: 'ConditionalField value',
            Control: 'TextBox',
            Type: 'string',
            DisplayOrder: 0,
            InputControlData: {
              displayConditions: [
                {
                  value: 'unknown',
                  operator: '!=',
                  refId: 2,
                },
              ],
            },
          },
        ],
      },
    })

    assert.equal(
      mappingOutput.CustomFields.Fields[1].InputControlData.displayConditions[0]
        .refId,
      mappingOutput.CustomFields.Fields[0].Id
    )
  })
})
