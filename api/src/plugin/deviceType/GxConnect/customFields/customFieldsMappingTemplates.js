const objectMapper = require('object-mapper')
const _ = require('lodash')

const map = aspectFields => {
  return {
    'fields[].id': 'CustomFields.Fields[].Id',
    'fields[].name': 'CustomFields.Fields[].Name',
    'fields[].assayId': 'CustomFields.Fields[].LimitToTestTypeIds[]',
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
    'fields[].migrateFromId': 'CustomFields.Fields[].MigrateFromId',
    'fields[].order': 'CustomFields.Fields[].DisplayOrder',
    'fields[].gxAlertDbColumn': 'CustomFields.Fields[].DbColumn',
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
      transform: sourceValue => translateCondition(sourceValue, aspectFields),
    },
  }
}
const propertyToNumber = sourceValue => {
  return _.isArray(sourceValue) && _.isNumber(sourceValue[0])
    ? sourceValue[0]
    : _.isNumber(sourceValue)
    ? sourceValue
    : null
}
const translateCondition = (sourceValue, aspectFields) => {
  const map = _.map(sourceValue, elem => {
    if (elem.gxAlertPropName)
      return {
        propName: elem.gxAlertPropName,
        operator:
          elem.operator === '==='
            ? '='
            : elem.operator === '!=='
            ? '!='
            : elem.operator,
        refId: _.get(
          _.find(
            aspectFields.fields,
            ({ name: fieldName }) => fieldName === elem.propToCompare
          ),
          'id'
        ),
      }
    return elem
  })
  return map
}

const mapGxConnectCustomFields = (aspectFields, mapper = null) => {
  return objectMapper(aspectFields, mapper || map(aspectFields))
}

module.exports = mapGxConnectCustomFields
