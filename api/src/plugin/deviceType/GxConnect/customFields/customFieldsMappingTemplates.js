const objectMapper = require('object-mapper')
const _ = require('lodash')
const Promise = require('bluebird')
const { stateSelectList } = require('../../../../geography/service')
const { getListSitesForSelectList } = require('../../../../site/service')

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
      transform: value => getGxAlertAssayId[value] || null,
    },
    'fields[].title': 'CustomFields.Fields[].Label',
    'fields[].caption': 'CustomFields.Fields[].Help',
    'fields[].required': {
      key: 'CustomFields.Fields[].InputControlData.optional?',
      transform: value => (value ? !value : true),
    },
    'fields[].encrypted': 'CustomFields.Fields[].Encrypted',
    // / TODO: agregar la conjunction y chequearlo en un test para filters.
    'fields[].controlType': {
      key: 'CustomFields.Fields[].Control',
      transform: sourceValue => {
        switch (sourceValue) {
          case 'datePicker':
            return 'DateTimePicker'
          default:
            return _.upperFirst(sourceValue)
        }
      },
    },
    'fields[].fieldType': {
      key: 'CustomFields.Fields[].Type',
      transform: sourceValue => {
        switch (sourceValue) {
          case 'number':
          case 'int':
            return 'int'
          case 'datetime':
          case 'date':
            return 'datetime'
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

    'fields[].items[].order':
      'CustomFields.Fields[].InputControlData.options[].displayOrder',
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
      transform: sourceValue =>
        translateCondition(sourceValue, aspectFields, true),
    },
    'fields[].items[]': {
      key: 'CustomFields.Fields[].InputControlData.options[]',
      transform: (source, sourceObject, destinationValue) => {
        _.each(destinationValue, customField => {
          if (
            _.get(customField, 'InputControlData.filters') &&
            customField.InputControlData.filters.length > 0
          ) {
            const [{ propName }] = customField.InputControlData.filters
            const { Id } = customField
            const { options } = _.find(
              destinationValue,
              elem => elem.Id === Id
            ).InputControlData
            // eslint-disable-next-line no-return-assign
            _.forEach(
              options,
              // eslint-disable-next-line no-return-assign
              option => {
                const selectedElem = _.find(
                  source,
                  elem => elem.key === option.value
                )
                if (selectedElem && selectedElem[propName])
                  option[propName] = selectedElem[propName]
              }
            )
          }
        })

        return null
      },
    },
    'fields[].optionSource': 'CustomFields.Fields[].optionSource',

    'fields[].calculated': {
      key: 'CustomFields.Fields[].InputControlData',
      transform: source => {
        return source ? { calculated: true, ...source } : null
      },
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
  if (!sourceValue) return null
  const map = _.map(sourceValue, elem => {
    if (elem.operator && !elem.refId) {
      const field = {
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
      if (elem.conjunction) field.conjunction = elem.conjunction
      if (elem.valueToCompare) field.value = elem.valueToCompare
      if (elem.fieldToCompare) field.propName = elem.fieldToCompare

      return field
    }

    return elem
  })
  return map
}

const mapGxConnectCustomFields = (aspectFields, mapper = null) => {
  const maped = objectMapper(aspectFields, mapper || map(aspectFields))

  return maped
}

const mapGxConnectCustomFieldsWithDataSources = async (
  aspectFields,
  { partnerId, countryId, stateId, mapper = null }
) => {
  const fields = mapGxConnectCustomFields(aspectFields, mapper)
  await Promise.each(
    _.filter(fields.CustomFields.Fields, elem => elem.optionSource),
    async field => {
      const { optionSource, customUrlMappingFields } = field
      if (optionSource === 'lga' || optionSource === 'state') {
        const { data: statesOrLgas } = await stateSelectList({
          params: {
            countryId,
            stateId: field.optionSource === 'lga' && stateId ? stateId : null,
          },
        })
        field.InputControlData.options = _.map(statesOrLgas, geography => ({
          value: geography.id,
          text: geography.name,
        }))
      } else if (optionSource === 'all-sites') {
        const dataConstraints = {
          partner: {
            id: partnerId,
          },
          country: {
            id: countryId,
          },
        }
        const { data: items } = await getListSitesForSelectList(dataConstraints)
        if (!field.InputControlData) {
          field.InputControlData = {}
        }
        field.InputControlData.options = _.map(items, item => ({
          value: item[customUrlMappingFields?.key || 'externalId'],
          text: item[customUrlMappingFields?.value || 'name'],
        }))
      }

      delete field.optionSource
    }
  )
  return fields
}
module.exports = {
  mapGxConnectCustomFieldsWithDataSources,
  mapGxConnectCustomFields,
}
