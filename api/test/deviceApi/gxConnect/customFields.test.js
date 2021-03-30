const { assert } = require('chai')
const Ajv = require('ajv')
const mapGxConnectCustomFields = require('../../../src/plugin/deviceType/GxConnect/customFields/customFieldsMappingTemplates')
const aspectFields = require('./customFieldsForm.json')
const mappingResult = require('./mappingResult.json')
const cascadeFieldsOutput = require('./cascadeFieldsOutput.json')
const schema = require('../../../jsonSchemas/dynamicFormSchema.json')

describe('Custom field mapper', () => {
  const ajv = new Ajv() // options can be passed, e.g. {allErrors: true}
  const validate = ajv.compile(schema)

  it('it generates the mapping between aspect dynamic forms and gxconnect expected json', () => {
    assert.isTrue(validate(aspectFields))
    const mappingOutput = mapGxConnectCustomFields(aspectFields)
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
    assert.isTrue(validate(numberExample))
    const mappingOutput = mapGxConnectCustomFields(numberExample)
    assert.deepEqual(mappingOutput.CustomFields.Fields, [
      {
        Id: 2,
        Name: 'PlainField',
        Help: 'PlainField value',
        Control: 'TextBox',
        Type: 'int',
        DisplayOrder: 1,
        InputControlData: { optional: true },
      },
    ])
  })

  it('should transform a datetime field', () => {
    const dateTimeExample = {
      fields: [
        {
          id: 2,
          name: 'Datepicker field',
          i18nKey: 'PlainFieldi18nKey',
          fieldType: 'date',
          order: 1,
          caption: 'Datepicker value',
          i18nKeyCaption: 'Datepicker value',
          controlType: 'datePicker',
        },
      ],
    }
    assert.isTrue(validate(dateTimeExample))
    const mappingOutput = mapGxConnectCustomFields(dateTimeExample)
    assert.deepEqual(mappingOutput.CustomFields.Fields, [
      {
        Id: 2,
        Name: 'Datepicker field',
        Help: 'Datepicker value',
        Control: 'DateTimePicker',
        Type: 'datetime',
        DisplayOrder: 1,
        InputControlData: { optional: true },
      },
    ])
  })

  it('it should map display conditions', () => {
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
    assert.isTrue(validate(displayConditionalExample))
    const mappingOutput = mapGxConnectCustomFields(displayConditionalExample)
    assert.deepEqual(mappingOutput, {
      CustomFields: {
        Fields: [
          {
            Id: 2,
            Name: 'PlainField',
            Help: 'PlainField value',
            Control: 'TextBox',
            Type: 'string',
            DisplayOrder: 1,
            InputControlData: { optional: true },
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
                  conjunction: 'AND',
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

  it('should render cascading controls', () => {
    const listCustomFields = {
      fields: [
        {
          id: 117,
          name: 'ReferringHealthFacilityProvince',
          title: 'Referring Health Facility Province',
          i18nKey: 'outcomei18nKey',
          fieldType: 'text',
          order: 40,
          controlType: 'autoComplete',
          required: true,
          typeOfOptionSource: 'fixedList',
          items: [
            {
              key: 'Punjab',
              text: 'Punjab',
              order: 0,
            },
            {
              key: 'Sindh',
              value: 'Sindh',
              order: 1,
            },
            {
              key: 'Balochistan',
              value: 'Balochistan',
              order: 3,
            },
            {
              key: 'Khyber Pakhtunkhwa',
              value: 'Khyber Pakhtunkhwa',
              order: 4,
            },
            {
              key: 'FATA',
              value: 'FATA',
              order: 5,
            },
            {
              key: 'Azad Jammu & Kahmir',
              value: 'Azad Jammu & Kahmir',
              order: 6,
            },
            {
              key: 'Gilgit Baltistan',
              value: 'Gilgit Baltistan',
              order: 7,
            },
            {
              key: 'Islamabad & CT',
              value: 'Islamabad & CT',
              order: 8,
            },
          ],
        },
        {
          id: 118,
          name: 'ReferringHealthFacilityDistrict',
          title: 'Referring Health Facility District',
          i18nKey: 'outcomei18nKey',
          fieldType: 'text',
          order: 45,
          controlType: 'autoComplete',
          required: false,
          typeOfOptionSource: 'fixedList',
          filters: [
            {
              propToCompare: 'ReferringHealthFacilityProvince',
              fieldToCompare: 'state',
              operator: '===',
            },
          ],
          items: [
            {
              key: 'Attock',
              value: 'Attock',
              order: 0,
              state: 'Punjab',
            },
            {
              key: 'Bahawalnagar',
              value: 'Bahawalnagar',
              order: 1,
              state: 'Punjab',
            },
            {
              key: 'Bahawalpur',
              value: 'Bahawalpur',
              order: 2,
              state: 'Punjab',
            },
            {
              key: 'Thatha',
              value: 'Thatha',
              order: 22,
              state: 'Sindh',
            },
            {
              key: 'Umerkot',
              value: 'Umerkot',
              order: 23,
              state: 'Sindh',
            },
            {
              key: 'Zhob',
              value: 'Zhob',
              order: 27,
              state: 'Balochistan',
            },
            {
              key: 'Ziarat',
              value: 'Ziarat',
              order: 28,
              state: 'Balochistan',
            },
            {
              key: 'Abbottabad',
              value: 'Abbottabad',
              order: 0,
              state: 'KP',
            },
            {
              key: 'Bannu',
              value: 'Bannu',
              order: 1,
              state: 'KP',
            },
            {
              key: 'Battagram',
              value: 'Battagram',
              order: 2,
              state: 'KP',
            },

            {
              key: 'Tank',
              value: 'Tank',
              order: 22,
              state: 'KP',
            },
            {
              key: 'Upper Dir',
              value: 'Upper Dir',
              order: 23,
              state: 'KP',
            },
            {
              key: 'Bajour Agency',
              value: 'Bajour Agency',
              order: 0,
              state: 'FATA',
            },
            {
              key: 'Khyber Agency',
              value: 'Khyber Agency',
              order: 1,
              state: 'FATA',
            },
            {
              key: 'Bagh',
              value: 'Bagh',
              order: 0,
              state: 'AJK',
            },
            {
              key: 'Bhimber',
              value: 'Bhimber',
              order: 1,
              state: 'AJK',
            },

            {
              key: 'Poonch',
              value: 'Poonch',
              order: 8,
              state: 'AJK',
            },
            {
              key: 'Sudhnoti',
              value: 'Sudhnoti',
              order: 9,
              state: 'AJK',
            },
            {
              key: 'Astore',
              value: 'Astore',
              order: 0,
              state: 'GB',
            },
            {
              key: 'Skardu',
              value: 'Skardu',
              order: 9,
              state: 'GB',
            },
            {
              key: 'Islamabad',
              value: 'Islamabad',
              order: 0,
              state: 'ICT',
            },
          ],
        },
      ],
    }
    assert.isTrue(validate(listCustomFields))

    const mappingOutput = mapGxConnectCustomFields(listCustomFields)
    assert.deepEqual(mappingOutput, cascadeFieldsOutput)
  })
  it('testing calculated fields', () => {
    const calculatedFields = {
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
          id: 3,
          name: 'calculatedField',
          i18nKey: 'calculatedFieldi18nKey',
          fieldType: 'date',
          order: 0,
          caption: 'calculatedField value',
          i18nKeyCaption: 'calculatedFieldi18nCaptionKey',
          controlType: 'label',
          calculated: {
            fieldId1: 2,
            fixedValue: 'now',
            function: 'datediff',
            format: 'week',
          },
        },
      ],
    }
    assert.isTrue(validate(calculatedFields))

    const mappingOutput = mapGxConnectCustomFields(calculatedFields)
    assert.deepEqual(mappingOutput, {
      CustomFields: {
        Fields: [
          {
            Id: 2,
            Name: 'PlainField',
            Help: 'PlainField value',
            InputControlData: {
              optional: true,
            },
            Control: 'TextBox',
            Type: 'string',
            DisplayOrder: 1,
          },
          {
            Id: 3,
            Name: 'calculatedField',
            Help: 'calculatedField value',
            Control: 'Label',
            Type: 'datetime',
            DisplayOrder: 0,
            InputControlData: {
              calculated: true,
              fieldId1: 2,
              fixedValue: 'now',
              function: 'datediff',
              format: 'week',
            },
          },
        ],
      },
    })
  })

  it('should transform a datasource input control data field', async () => {
    const datasourceExample = {
      fields: [
        {
          id: 2,
          name: 'datasource field',
          i18nKey: 'datasourcei18nKey',
          fieldType: 'text',
          order: 1,
          caption: 'datasource value',
          i18nKeyCaption: 'datasource value',
          controlType: 'textBox',
          optionSource: 'state',
        },
      ],
    }

    assert.isTrue(validate(datasourceExample))

    const mappingOutput = await mapGxConnectCustomFields(datasourceExample, 1)
    assert.deepEqual(mappingOutput.CustomFields.Fields, [
      {
        Id: 2,
        Name: 'datasource field',
        Help: 'datasource value',
        InputControlData: {
          optional: true,
          dataSource: {
            name: 'state',
          },
        },
        Control: 'TextBox',
        Type: 'string',
        DisplayOrder: 1,
      },
    ])
  })
})
