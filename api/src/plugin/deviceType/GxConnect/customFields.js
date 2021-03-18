const objectMapper = require('object-mapper')
const _ = require('lodash')
const aspectFields = require('./form.json')

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
  'fields[].required': 'CustomFields.Fields[].Required',
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
}

const dest = objectMapper(aspectFields, map)
return dest
// console.log(dest.CustomFields.Fields)
// console.log(JSON.stringify(dest,null,'\t'))
