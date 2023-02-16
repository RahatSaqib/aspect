const objectMapper = require('object-mapper')
const _ = require('lodash')

// all values should match returned values in func `GetTestTypeIdByAssayName`
// in GxConnect file `Utilities/Helpers.cs`
const getGxAlertAssayId = {
  abbottM2000PlasmaHivVL: 9,
  abbottM2000PlasmaHbvVL: 9,
  abbottM2000DBSHivVL: 9,
  abbottM2000HIVEID: 9,
  abbottM2000DaanNCOVID19: 15,
  GxMtbRif: 4,
  GxMtbRifUltra: 12,
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
const baseMapper = aspectFields => {
  return {
    'fields[].id': 'CustomFields.Fields[].Id',
    'fields[].name': [
      { key: 'CustomFields.Fields[].Name', transform: value => value },
      {
        key: 'CustomFields.Fields[].ExternalId',
        transform: value => _.startCase(value).replace(/\s/g, ''),
      },
    ],
    'fields[].assayExternalId': {
      key: 'CustomFields.Fields[].LimitToTestTypeIds[]',
      transform: value => getGxAlertAssayId[value] || null,
    },
    'fields[].title': 'CustomFields.Fields[].Label',
    'fields[].caption': 'CustomFields.Fields[].Help',
    'fields[].mandatory': 'CustomFields.Fields[].InputControlData.Mandatory',
    'fields[].needsConfirmationIfIsEmpty': {
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
    /**
     * items - base 4 props, mapping from `source` (in form definition JSON)
     * to `target` (custom field options)
     * `source`  `target`
     *  key    ->  value
     *  value  ->  text
     *  order  ->  displayOrder
     *  isDefault -> isDefault (optional)
     */
    'fields[].items[].key': 'CustomFields.Fields[].InputControlData.options[].value',
    'fields[].items[].value': 'CustomFields.Fields[].InputControlData.options[].text',
    'fields[].items[].order': 'CustomFields.Fields[].InputControlData.options[].displayOrder',
    'fields[].items[].isDefault': 'CustomFields.Fields[].InputControlData.options[].isDefault',

    'fields[].validation[].min': {
      key: 'CustomFields.Fields[].InputControlData.minValue',
      transform: sourceValue => propertyToNumber(sourceValue),
    },
    'fields[].validation[].max': {
      key: 'CustomFields.Fields[].InputControlData.maxValue',
      transform: sourceValue => propertyToNumber(sourceValue),
    },
    'fields[].condition': {
      key: 'CustomFields.Fields[].InputControlData.displayConditions',
      transform: sourceValue => translateCondition(sourceValue, aspectFields),
    },
    'fields[].filters': {
      key: 'CustomFields.Fields[].InputControlData.filters',
      transform: sourceValue => translateCondition(sourceValue, aspectFields, true),
    },
    'fields[].items[]': {
      key: 'CustomFields.Fields[].InputControlData.options[]',
      transform: transformItemsToOptions,
    },
    'fields[].itemsSource': 'CustomFields.Fields[].itemsSource',
    'fields[].emptyIfDisabled': 'CustomFields.Fields[].InputControlData.emptyIfDisabled',

    'fields[].calculated': {
      key: 'CustomFields.Fields[].InputControlData',
      transform: source => {
        return source ? { calculated: true, ...source } : null
      },
    },
  }
}

const transformItemsToOptions = (source, sourceObject, destinationValue) => {
  /**
   * - get 1st item with defined array `items`
   * - get item with same `items` as `source`
   * - if they differ - exit
   */
  const srcFirst = sourceObject.fields.find(({ items }) => !!items)
  const srcThis = sourceObject.fields.find(({ items }) => _.isEqual(items, source))
  if (srcFirst !== srcThis) {
    return null
  }

  /**
   * Above `if` makes sure we process below code only once
   */
  _.forEach(destinationValue, customField => {
    const { Id, InputControlData: { options } = {} } = customField
    const src = sourceObject.fields.find(({ id }) => id === Id)
    if (options) {
      /**
       * if `options` defined then corresponding array
       * `items` is also defined in source - so we may
       * use same `index` to map entries in both arrays
       */
      _.forEach(src.items, (item, index) => {
        // eslint-disable-next-line no-unused-vars
        const { key, value, order, ...rest } = item
        /**
         * skip above base props (key, value, order)
         * to append props from `rest`.
         * Make sure that props from `option` override
         * props from `rest` - need this to use actual
         * props mapped above (they are in
         * `option`) - `text`, `value`, `displayOrder`.
         */
        options[index] = { ...rest, ...options[index] }
      })
    }
  })

  return null
}

const isNumeric = n => !Number.isNaN(parseFloat(n)) && Number.isFinite(n)

const propertyToNumber = sourceValue => {
  if (isNumeric(sourceValue)) {
    return parseInt(sourceValue, 10)
  }

  if (_.isArray(sourceValue)) {
    const numberFound = sourceValue.find(value => isNumeric(value))
    return parseInt(numberFound, 10)
  }

  return null
}

const translateCondition = (sourceValue, aspectFields) => {
  if (!sourceValue) return null
  const map = _.map(sourceValue, elem => {
    if (elem.operator && !elem.refId) {
      const field = {
        operator: elem.operator === '===' ? '=' : elem.operator === '!==' ? '!=' : elem.operator,
        refId: _.get(
          _.find(aspectFields.fields, ({ name: fieldName }) => fieldName === elem.propToCompare),
          'id'
        ),
      }
      if (elem.conjunction) field.conjunction = elem.conjunction
      if (elem.valueToCompare !== undefined) field.value = elem.valueToCompare
      if (elem.fieldToCompare) field.propName = elem.fieldToCompare

      return field
    }

    return elem
  })
  return map
}

const mapGxConnectCustomFields = (aspectFields, mapper = null) => {
  const mapped = objectMapper(aspectFields, mapper || baseMapper(aspectFields))

  return mapped
}

module.exports = {
  mapGxConnectCustomFields,
}
