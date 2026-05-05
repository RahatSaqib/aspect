import get from 'lodash/get'
import isArray from 'lodash/isArray'
import isString from 'lodash/isString'
import set from 'lodash/set'
import uniqBy from 'lodash/uniqBy'
import * as Yup from 'yup'
import { getInitialValuesFromFormConfig, mergeFormConfigWithData } from '../../../components/Form/Formik/Helpers'
import { validationErrorMessages } from '../../../messages'
import getFormConfig from './Forms/editConfig'
import getValidationSchema from './Forms/validation'
import messages from './messages'

const TRUENAT_DEVICE_TYPE_EXTERNAL_ID = 'molbioTruenat'

const toCamelCase = str => {
  return str
    .toLowerCase()
    .replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) => (index === 0 ? match.toLowerCase() : match.toUpperCase()))
    .replace(/\s+/g, '')
}

export const getFormConfigWithData = (intl, isNew, values) => {
  const formSchema = getFormConfig(intl.formatMessage, isNew, values.assay)
  const customFieldsSectionIndex = formSchema.sections.findIndex(({ id }) => id === 'CustomFields')
  const isTrueNatDevice = values.assay?.deviceTypeExternalId === TRUENAT_DEVICE_TYPE_EXTERNAL_ID

  const customFields = { ...formSchema.sections[customFieldsSectionIndex] }
  if (isTrueNatDevice) {
    customFields.headerNoteI18nKey = 'truenatCustomFieldsReadOnlyNote'
  }

  let validationSchema = getValidationSchema(intl.formatMessage)

  const totalCustomFields = values.customFields?.length || 0
  // if no custom fields just a placeholder just in case it changes in the future
  if (totalCustomFields === 0) {
    customFields.rows = [
      { id: 9000, items: [{ controlType: { component: 'textField' }, labelI18nKey: 'noCustomFieldsDefined' }] },
    ]
  } else {
    // generate custom rows
    customFields.rows = getRowsForCustomFields(values, isTrueNatDevice)
    // generate validations
    validationSchema = validationSchema.shape(getValidationsForCustomFields(values, intl.formatMessage))
  }

  const formSchemaOut = {
    ...formSchema,
    sections: formSchema.sections.map((section, i) => (i === customFieldsSectionIndex ? customFields : section)),
  }

  const initialValues = getInitialValuesFromFormConfig(formSchemaOut, values)

  return {
    ...mergeFormConfigWithData(initialValues, formSchemaOut, messages),
    validationSchema,
    values: initialValues,
  }
}

function getRowsForCustomFields(values, isTrueNatDevice) {
  const id = 9000
  let rows = []
  // show 2 cells per row
  const cellsPerRow = 2
  let row = {}
  uniqBy(values.customFields, elem => elem.source).forEach((customField, index) => {
    if (index % cellsPerRow === 0) {
      if (index > 0) {
        rows = [...rows, row]
      }
      row = { id: id + index, items: [] }
    }
    const baseItem = {
      id: customField.source,
      label: customField.title,
      disabledIf: () => !customField.source || isTrueNatDevice,
    }
    // Hack ASP-7604 Custom Fields Translations are broken: I18Key from the custom field
    // is not received from the backend, so we try to build it from the title and check if
    // it exists in the messages.
    // TODO: Refactor this in the future, sending the i18n key from the custom field in the backend.
    const labelI18nKey = toCamelCase(customField.title)
    if (messages[labelI18nKey]) {
      baseItem.labelI18nKey = labelI18nKey
    }

    if (customField.controlType === 'comboBox' || customField.controlType === 'autoComplete') {
      const initialValue = get(values, customField.source)
      row.items.push({
        ...baseItem,
        initialValue,
        controlType: {
          component: 'select',
          options: customField.items
            .sort((a, b) => a.order - b.order)
            .map(i => ({
              value: customField.sourceType === 'key' ? i.key : i.value,
              label: i.value,
              scope: i.scope || undefined,
            })),
        },
      })
    } else if (
      customField.controlType === 'textBox' &&
      (customField.fieldType === 'text' || customField.fieldType === 'phone')
    ) {
      row.items.push({ ...baseItem, controlType: { component: 'textField' } })
    } else if (customField.controlType === 'textBox' && customField.fieldType === 'number') {
      // assuming only one validation
      const validation =
        customField.validation && customField.validation.length
          ? customField.validation[0]
          : { min: 1, max: 100, errorMessage: '' }
      // ASP-5626: 1. validation: validates the value type of textboxes (integer and strings), and validates min and max values
      row.items.push({
        ...baseItem,
        controlType: { component: 'numberField', min: validation.min, max: validation.max },
      })
    } else if (customField.fieldType === 'datetime') {
      row.items.push({
        ...baseItem,
        controlType: { component: 'datePicker' },
      })
    }
  })

  rows.push(row)

  return rows
}

const getValidationRule = (customField, formatMessage) => {
  let validationRule = Yup.mixed()

  if (customField.controlType === 'textBox' && customField.fieldType === 'text') {
    // add validation for text
    validationRule = Yup.string()
  } else if (customField.controlType === 'textBox' && customField.fieldType === 'number') {
    const validation =
      customField.validation && customField.validation.length
        ? customField.validation[0]
        : { min: 1, max: 100, errorMessage: '' }
    validationRule = Yup.number()
      .positive()
      .integer()
      .min(validation.min || 1, validation.errorMessage)
      .max(validation.max, validation.errorMessage)
  }

  if (customField.optional === false) {
    validationRule = validationRule.required(formatMessage(validationErrorMessages.required))
  }

  return validationRule
}

const getValidationsForCustomFields = (values, formatMessage) =>
  uniqBy(values.customFields, elem => elem.source).reduce((form, customField) => {
    if (customField.source && isString(customField.source)) {
      const source = customField.source.split('.')
      const isNestedObject = source.length > 1

      const validationRule = getValidationRule(customField, formatMessage)

      if (isNestedObject) {
        const dataOrigin = source[0]
        const dataField = source[1]

        if (!Object.keys(form).includes(source[0])) {
          // Create subgroup
          form[dataOrigin] = Yup.object({})
        }

        // Add a custom field to the subgroup
        form[dataOrigin] = form[dataOrigin].shape({ [dataField]: validationRule })
      } else {
        // Add a custom field to the group
        form[customField.source] = validationRule
      }
    }
    return form
  }, {})

// start enable/disable logic
const evaluateCondition = (condition, sourcePath, formik) => {
  const cleanValue = formik.values[sourcePath[0]][condition.propToCompare]
  switch (condition.operator) {
    case '=':
      if (typeof condition.valueToCompare === 'number') {
        return cleanValue === condition.valueToCompare
      }
      return cleanValue === condition.valueToCompare?.toLowerCase()
    default:
      return false
  }
}

const evaluateEnabledState = (itemBase, formik) => {
  const sourcePath = itemBase.source.split('.')
  const individualResponses = itemBase.condition.map(c => evaluateCondition(c, sourcePath, formik))
  const operator = itemBase.condition[0].conjunction || 'AND' // only options are AND & OR

  const resp = individualResponses.reduce((acc, curr) => {
    // the first conjuntion is used for all cases, ie. if AND we evaluate all indivudual responses with
    // AND connector (opt1 && opt2 && ...) else with OR (opt1 || opt2 || ...)
    return operator === 'AND' ? acc && curr : acc || curr
  }, operator === 'AND')
  return resp
}
// end enable/disable logic

// start filter logic
const applyFilterToOption = (filter, option, formik, sourcePath) => {
  const data = option[filter.fieldToCompare]
  if (!data) return

  const cleanList = isArray(data) ? data : [data]
  const cleanValue = formik.values[sourcePath[0]][filter.propToCompare]
  if (filter.operator === 'in') {
    return cleanList.map(o => o.toLowerCase()).includes(cleanValue)
  }
}

const calculateFilteredOptions = (itemBase, item, formik) => {
  const allFilters = itemBase.filters
  const sourcePath = itemBase.source.split('.')

  return itemBase.items.filter(option => {
    const resp = []
    allFilters.forEach(filter => (applyFilterToOption(filter, option, formik, sourcePath) ? resp.push(option) : null))
    return resp.length
  })
}
// end filter logic

const enableItemAndFilter = (item, data, formik, keepInvalidSelection) => {
  const idToUpdate = item.id
  const itemBase = data.find(itemBase => itemBase.source === idToUpdate)

  // if no item base to work with, we skip the whole section
  if (itemBase) {
    // ASP-5626: 2. condition: based on comparatives with other custom fields, enables and disables the custom field
    if (itemBase.condition) {
      const existingDisabledIf = item.disabledIf
      item.disabledIf = (values, isEditMode) => {
        const isAlreadyDisabled = existingDisabledIf ? existingDisabledIf(values, isEditMode) : false
        return isAlreadyDisabled || !evaluateEnabledState(itemBase, formik) // NOT enabled state === disabled
      }
      item.controlType.hideIfNoOptions = false
    }

    // ASP-5626: 3. filters: based on comparative with other custom fields, shows or hides options in combobox and autocomplete.
    if (itemBase.filters) {
      const filteredOptions = calculateFilteredOptions(itemBase, item, formik)

      // first update the available options
      item.controlType.options = filteredOptions
        .sort((a, b) => a.order - b.order)
        .map(i => ({ value: i.value, label: i.value, scope: i.scope || undefined }))
      item.controlType.dependencies = [itemBase.source]

      if (!keepInvalidSelection) {
        // second, clear any invalid option from already selected values
        const currentValidValues = filteredOptions.map(o => o.value.toLowerCase())
        const currentSelectdValue = get(formik.values, itemBase.source, '').toLowerCase()
        if (!currentValidValues.includes(currentSelectdValue)) {
          set(formik.values, itemBase.source, '')
        }
      }
    }
  }

  return item
}

export const updateValidationsAndFilters = (sections, data, formik, keepInvalidSelection) => {
  return sections.map((section, index) => {
    // last section is custom fields
    if (index === sections.length - 1) {
      section = {
        ...section,
        rows: section.rows.map(r => ({
          ...r,
          items: r.items.map(item => enableItemAndFilter(item, data, formik, keepInvalidSelection)),
        })),
      }
    }
    return section
  })
}
