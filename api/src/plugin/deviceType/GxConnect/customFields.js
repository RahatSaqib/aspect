const objectMapper = require('object-mapper')
const _ = require('lodash')
const aspectFields = require('../../../forms/formsDefinition/TBProbes.json')

const propertyToNumber = sourceValue => {
  return _.isArray(sourceValue) && _.isNumber(sourceValue[0])
    ? sourceValue[0]
    : _.isNumber(sourceValue)
    ? sourceValue
    : null
}
const translateCondition = sourceValue => {
  const map = _.map(
    sourceValue,
    ({ propToCompare = null, operator, gxAlertPropName = null }) => ({
      propName: gxAlertPropName,
      operator: operator === '===' ? '=' : operator === '!==' ? '!=' : operator,
      refId: _.get(
        _.find(
          aspectFields.Fields,
          ({ name: fieldName }) => fieldName === propToCompare
        ),
        'id'
      ),
    })
  )
  return map
}
const map = {
  'fields[].id': 'CustomFields.Fields[].Id',
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
  'fields[].validation[].min': {
    key: 'CustomFields.Fields[].InputControlData.minValue',
    transform: sourceValue => propertyToNumber(sourceValue),
  },
  'fields[].validation[0].max': {
    key: 'CustomFields.Fields[].InputControlData.maxValue',
    transform: sourceValue => propertyToNumber(sourceValue),
  },
  'fields[].condition': {
    key: 'CustomFields.Fields[].InputControlData.filters',
    transform: sourceValue => translateCondition(sourceValue),
  },
}
objectMapper(aspectFields, map)
// console.log(
//   objectMapper(aspectFields, map).CustomFields.Fields[0].InputControlData
// )

// return destinationInventoryItem
// console.log(dest.CustomFields.Fields)
// console.log(JSON.stringify(dest,null,'\t'))
