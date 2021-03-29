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

  it.only('should render cascading controls', () => {
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
          required: false,
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
              conjunction: 'AND',
              propToCompare: 'ReferringHealthFacilityProvince',
              fieldToCompare: 'state',
              operator: '===',
              conjunctionGroupName: 'PlainFieldCollectionGroup',
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
    const mappingOutput = mapGxConnectCustomFields(listCustomFields)
    console.log(JSON.stringify(mappingOutput))
    assert.equal(mappingOutput, {
      CustomFields: {
        Fields: [
          {
            Id: 117,
            Name: 'ReferringHealthFacilityProvince',
            Label: 'Referring Health Facility Province',
            Optional: false,
            Control: 'AutoComplete',
            Type: 'string',
            DisplayOrder: 40,
            InputControlData: {
              options: [
                { value: 'Punjab', displayOrder: 0 },
                { value: 'Sindh', text: 'Sindh', displayOrder: 1 },
                { value: 'Balochistan', text: 'Balochistan', displayOrder: 3 },
                {
                  value: 'Khyber Pakhtunkhwa',
                  text: 'Khyber Pakhtunkhwa',
                  displayOrder: 4,
                },
                { value: 'FATA', text: 'FATA', displayOrder: 5 },
                {
                  value: 'Azad Jammu & Kahmir',
                  text: 'Azad Jammu & Kahmir',
                  displayOrder: 6,
                },
                {
                  value: 'Gilgit Baltistan',
                  text: 'Gilgit Baltistan',
                  displayOrder: 7,
                },
                {
                  value: 'Islamabad & CT',
                  text: 'Islamabad & CT',
                  displayOrder: 8,
                },
              ],
            },
          },
          {
            Id: 118,
            Name: 'ReferringHealthFacilityDistrict',
            Label: 'Referring Health Facility District',
            Optional: false,
            Control: 'AutoComplete',
            Type: 'string',
            DisplayOrder: 45,
            InputControlData: {
              options: [
                {
                  value: 'Attock',
                  text: 'Attock',
                  displayOrder: 0,
                  state: 'Punjab',
                },
                {
                  value: 'Bahawalnagar',
                  text: 'Bahawalnagar',
                  displayOrder: 1,
                  state: 'Punjab',
                },
                {
                  value: 'Bahawalpur',
                  text: 'Bahawalpur',
                  displayOrder: 2,
                  state: 'Punjab',
                },
                {
                  value: 'Thatha',
                  text: 'Thatha',
                  displayOrder: 22,
                  state: 'Sindh',
                },
                {
                  value: 'Umerkot',
                  text: 'Umerkot',
                  displayOrder: 23,
                  state: 'Sindh',
                },
                {
                  value: 'Zhob',
                  text: 'Zhob',
                  displayOrder: 27,
                  state: 'Balochistan',
                },
                {
                  value: 'Ziarat',
                  text: 'Ziarat',
                  displayOrder: 28,
                  state: 'Balochistan',
                },
                {
                  value: 'Abbottabad',
                  text: 'Abbottabad',
                  displayOrder: 0,
                  state: 'KP',
                },
                { value: 'Bannu', text: 'Bannu', displayOrder: 1, state: 'KP' },
                {
                  value: 'Battagram',
                  text: 'Battagram',
                  displayOrder: 2,
                  state: 'KP',
                },
                { value: 'Tank', text: 'Tank', displayOrder: 22, state: 'KP' },
                {
                  value: 'Upper Dir',
                  text: 'Upper Dir',
                  displayOrder: 23,
                  state: 'KP',
                },
                {
                  value: 'Bajour Agency',
                  text: 'Bajour Agency',
                  displayOrder: 0,
                  state: 'FATA',
                },
                {
                  value: 'Khyber Agency',
                  text: 'Khyber Agency',
                  displayOrder: 1,
                  state: 'FATA',
                },
                { value: 'Bagh', text: 'Bagh', displayOrder: 0, state: 'AJK' },
                {
                  value: 'Bhimber',
                  text: 'Bhimber',
                  displayOrder: 1,
                  state: 'AJK',
                },
                {
                  value: 'Poonch',
                  text: 'Poonch',
                  displayOrder: 8,
                  state: 'AJK',
                },
                {
                  value: 'Sudhnoti',
                  text: 'Sudhnoti',
                  displayOrder: 9,
                  state: 'AJK',
                },
                {
                  value: 'Astore',
                  text: 'Astore',
                  displayOrder: 0,
                  state: 'GB',
                },
                {
                  value: 'Skardu',
                  text: 'Skardu',
                  displayOrder: 9,
                  state: 'GB',
                },
                {
                  value: 'Islamabad',
                  text: 'Islamabad',
                  displayOrder: 0,
                  state: 'ICT',
                },
              ],
              filters: [{ operator: '=', refId: 117, propName: 'state' }],
            },
          },
        ],
      },
    })
  })
})
