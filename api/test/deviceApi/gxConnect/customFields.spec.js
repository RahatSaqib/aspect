const { assert } = require('chai')
const validate = require('../../../jsonSchemas/validate')
const {
  mapGxConnectCustomFields,
} = require('../../../src/plugin/deviceType/GxConnect/customFields/customFieldsMappingTemplates')
const { replaceOptionSourceProp } = require('../../../src/forms/service')
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
          itemsSource: 'lga',
        },
      ],
    }

    assert.isTrue(validate(schema, datasourceExample))
    await replaceOptionSourceProp(datasourceExample.fields, 1, 1)
    const gxFields = await mapGxConnectCustomFields(datasourceExample)

    assert.containSubset(gxFields.CustomFields.Fields[0], {
      Id: 2,
      Name: 'datasource field',
      Help: 'datasource value',
      Control: 'TextBox',
      Type: 'string',
      DisplayOrder: 1,
    })
    assert.isAtLeast(gxFields.CustomFields.Fields[0].InputControlData.options.length, 1)
  })
})
