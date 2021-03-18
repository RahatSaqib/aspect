const objectMapper = require('object-mapper')
const _ = require('lodash')
const aspectFields = require('../../../forms/formsDefinition/TBProbes.json')

let i = 1
const map = {
  'fields[].i18nKey': {
    key: 'CustomFields.Fields[].Id',
    // eslint-disable-next-line no-plusplus
    transform: () => i++,
  },

  'fields[].name': 'CustomFields.Fields[].Name',
  'fields[].title': 'CustomFields.Fields[].Label',
  'fields[].caption': 'CustomFields.Fields[].Help',
  'fields[].required': {
    key: 'CustomFields.Fields[].Optional',
    transform: value => !value,
  },
  'fields[].encrypted': 'CustomFields.Fields[].Encrypted',
  'fields[].controlType': {
    key: 'CustomFields.Fields[].Control',
    transform: sourceValue => _.upperFirst(sourceValue),
  },
  'fields[].fieldType': {
    key: 'CustomFields.Fields[].Type',
    transform: sourceValue => (sourceValue === 'number' ? 'int' : 'string'),
  },
  'fields[].order': 'CustomFields.Fields[].DisplayOrder',
  'fields[].items[].key':
    'CustomFields.Fields[].InputControlData.options[].value',
  'fields[].items[].value':
    'CustomFields.Fields[].InputControlData.options[].text',
  'fields[].validation[0].min':
    'CustomFields.Fields[].InputControlData.minValue',
  'fields[].validation[0].max':
    'CustomFields.Fields[].InputControlData.maxValue',
}
objectMapper(aspectFields, map)
// console.log(objectMapper(aspectFields, map).CustomFields.Fields)

// return destinationInventoryItem
// console.log(dest.CustomFields.Fields)
// console.log(JSON.stringify(dest,null,'\t'))
