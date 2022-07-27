const { assert } = require('chai')
const validate = require('../../../jsonSchemas/validate')
const {
  mapGxConnectCustomFieldsWithDataSources,
} = require('../../../src/plugin/deviceType/GxConnect/customFields/customFieldsMappingTemplates')
const schema = require('../../../jsonSchemas/dynamicFormSchema.json')

describe('Custom field mapper', () => {
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
          optionSource: 'lga',
        },
      ],
    }

    assert.isTrue(validate(schema, datasourceExample))

    const mappingOutput = await mapGxConnectCustomFieldsWithDataSources(datasourceExample, {
      countryId: 1,
      stateId: 1,
    })

    assert.notDeepEqual(mappingOutput.CustomFields.Fields, [
      {
        Id: 2,
        Name: 'datasource field',
        Help: 'datasource value',
        InputControlData: {
          optional: true,
          options: [],
        },
        Control: 'TextBox',
        Type: 'string',
        DisplayOrder: 1,
      },
    ])
  })
})
