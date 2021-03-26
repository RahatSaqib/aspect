const objectMapper = require('object-mapper')
const _ = require('lodash')

const getGxAlertAssayId = {
  abbottM2000PlasmaHivVL: 9,
  abbottM2000PlasmaHbvVL: 9,
  abbottM2000DBSHivVL: 9,
  abbottM2000HIVEID: 9,
  abbottM2000DaanNCOVID19: 15,
  GxMtbRif: 4,
  GxMtbRifUltra: 10,
  GxHiv1Vl: 9,
  GxHiv1Qual: 8,
  GxEbola: 7,
  GxHcv: 14,
  DaktariHcv: 14,
  DaktariHivVL: 14,
  QHivVL: 9,
  CHAIHivVL: 9,
  CommCareHiv: 8,
  ReporterHivVL: 9,
  assayCobasHivVl: 9,
  assayGenericCovid19: 15,
  assayMP96Covid19: 15,
  assayQS7Covid19: 15,
  assayGXCovid19: 15,
}
const map = aspectFields => {
  return {
    'fields[].id': 'CustomFields.Fields[].Id',
    'fields[].name': 'CustomFields.Fields[].Name',
    'fields[].assayExternalId': {
      key: 'CustomFields.Fields[].LimitToTestTypeIds[]',
      transform: value => getGxAlertAssayId[value],
    },
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
      transform: sourceValue => {
        switch (sourceValue) {
          case 'number':
          case 'int':
            return 'int'
          default:
            return 'string'
        }
      },
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
      key: 'CustomFields.Fields[].InputControlData.displayConditions',
      transform: sourceValue => translateCondition(sourceValue, aspectFields),
    },
    'fields[].filters': {
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
    if (elem.operator && !elem.refId) {
      const field = {
        value: elem.valueToCompare,
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
      if (elem.fieldToCompare) field.propName = elem.fieldToCompare

      return field
    }

    return elem
  })
  return map
}

const mapGxConnectCustomFields = (aspectFields, mapper = null) => {
  return objectMapper(aspectFields, mapper || map(aspectFields))
}

module.exports = mapGxConnectCustomFields
