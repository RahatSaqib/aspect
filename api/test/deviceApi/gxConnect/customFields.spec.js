const { assert } = require('chai')
const Ajv = require('ajv')
const mapGxConnectCustomFieldsWithDataSources = require('../../../src/plugin/deviceType/GxConnect/customFields/customFieldsMappingTemplates')
const schema = require('../../../jsonSchemas/dynamicFormSchema.json')

describe('Custom field mapper', () => {
  const ajv = new Ajv() // options can be passed, e.g. {allErrors: true}
  const validate = ajv.compile(schema)

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

    assert.isTrue(validate(datasourceExample))

    const mappingOutput = await mapGxConnectCustomFieldsWithDataSources(
      datasourceExample,
      1,
      1
    )

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
