import uniqBy from 'lodash/uniqBy'
import * as Yup from 'yup'
import { getInitialValuesFromFormConfig, mergeFormConfigWithData } from '../../../components/Form/Formik/Helpers'
import getFormConfig from '../Forms/editConfig'
import getValidationSchema from '../Forms/validation'
import messages from './messages'

export const getFormConfigWithData = (intl, isNew, values) => {
  const formSchema = getFormConfig(intl.formatMessage, isNew, values.assay)

  const customFields = formSchema.sections.find(({ id }) => id === 'CustomFields')
  let validationSchema = getValidationSchema(intl.formatMessage)

  if (customFields) {
    customFields.rows = getRowsForCustomFields(values)
    validationSchema = validationSchema.shape(getValidationsForCustomFields(values))
  }

  const initialValues = getInitialValuesFromFormConfig(formSchema, values)

  return {
    ...mergeFormConfigWithData(initialValues, formSchema, messages),
    validationSchema,
    values: initialValues,
  }
}

function getRowsForCustomFields(values) {
  const totalCustomFields = values.customFields?.length || 0
  const id = 9000
  if (totalCustomFields === 0) {
    return [{ id, items: [{ controlType: { component: 'textField' }, labelI18nKey: 'noCustomFieldsDefined' }] }]
  }
  let rows = []
  // show 3 cells per row
  const cellsPerRow = 3
  let row = {}
  uniqBy(values.customFields, elem => elem.source).forEach((customField, index) => {
    if (index % cellsPerRow === 0) {
      if (index > 0) {
        rows = [...rows, row]
      }

      row = { id: id + index, items: [] }
    }

    const source = customField.source.split('.')

    if (customField.controlType === 'comboBox' || customField.controlType === 'autoComplete') {
      row.items = [
        ...row.items,
        {
          id: customField.source,
          label: customField.title,
          initialValue: values[source[0]][source[1]] ? [values[source[0]][source[1]]] : '',
          controlType: {
            component: 'select',
            options: customField.items
              .sort((a, b) => a.order - b.order)
              .map(i => ({ value: i.value, label: i.value, scope: i.scope || undefined })),
          },
        },
      ]
    } else if (customField.controlType === 'textBox' && customField.fieldType === 'text') {
      row.items = [
        ...row.items,
        { id: customField.source, controlType: { component: 'textField' }, label: customField.title },
      ]
    } else if (customField.controlType === 'textBox' && customField.fieldType === 'number') {
      // assuming only one validation
      const validation = customField.validation[0]
      row.items = [
        ...row.items,
        // ASP-5626: 1. validation: validates the value type of textboxes (integer and strings), and validates min and max values
        {
          id: customField.source,
          controlType: { component: 'numberField', min: validation.min, max: validation.max },
          label: customField.title,
        },
      ]
    }
  })

  rows = [...rows, row]

  return rows
}

function getValidationsForCustomFields(values) {
  const totalCustomFields = values.customFields?.length || 0
  const rows = {}

  if (totalCustomFields === 0) {
    return rows
  }

  uniqBy(values.customFields, elem => elem.source).forEach(customField => {
    const source = customField.source.split('.')
    const dataOrigin = source[0]
    const dataField = source[1]

    if (!Object.keys(rows).includes(dataOrigin)) {
      rows[dataOrigin] = Yup.object({})
    }

    if (customField.controlType === 'comboBox' || customField.controlType === 'autoComplete') {
      // add validation for select
    } else if (customField.controlType === 'textBox' && customField.fieldType === 'text') {
      // add validation for text
    } else if (customField.controlType === 'textBox' && customField.fieldType === 'number') {
      rows[dataOrigin] = rows[dataOrigin].shape({
        [dataField]: Yup.number()
          .required(customField.validation[0].errorMessage)
          .positive()
          .integer()
          .min(customField.validation[0].min || 1, customField.validation[0].errorMessage)
          .max(customField.validation[0].max, customField.validation[0].errorMessage),
      })
    }
  })

  return rows
}

const sanitizeValue = value => value.replaceAll('-', '').replaceAll(',', '').replaceAll('  ', ' ').split(' ').join('_')

// start enable/disable logic
const evaluateCondition = (condition, sourcePath, formik) => {
  const cleanValue = sanitizeValue(formik.values[sourcePath[0]][condition.propToCompare]).toLowerCase()
  switch (condition.operator) {
    case '=':
      return cleanValue === condition.valueToCompare.toLowerCase()
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
  const cleanList = option[filter.fieldToCompare].map(o => o.toLowerCase())
  const cleanValue = sanitizeValue(formik.values[sourcePath[0]][filter.propToCompare]).toLowerCase()
  switch (filter.operator) {
    case 'in':
      return cleanList.includes(cleanValue)
    default:
  }
}

const calculateFilteredOptions = (itemBase, item, formik) => {
  const allFilters = itemBase.filters
  const sourcePath = itemBase.source.split('.')

  return item.controlType.options.filter(option => {
    const resp = []
    allFilters.forEach(filter => (applyFilterToOption(filter, option, formik, sourcePath) ? resp.push(option) : null))
    return resp.length
  })
}
// end filter logic

const enableItemAndFilter = (item, data, formik) => {
  const idToUpdate = item.id
  const itemBase = data.find(itemBase => itemBase.source === idToUpdate)

  // ASP-5626: 2. condition: based on comparatives with other custom fields, enables and disables the custom field
  if (itemBase.condition) {
    item.disabledIf = () => !evaluateEnabledState(itemBase, formik) // NOT enabled state === disabled
  }

  // ASP-5626: 3. filters: based on comparative with other custom fields, shows or hides options in combobox and autocomplete.
  if (itemBase.filters) {
    const field = itemBase.source.split('.')
    const filteredOptions = calculateFilteredOptions(itemBase, item, formik)

    // first update the available options
    item.controlType.options = filteredOptions
    item.controlType.dependencies = [itemBase.source]

    // second, clear any invalid option from already selected values
    const currentValidValues = filteredOptions.map(o => o.value.toLowerCase())
    const currentSelectdValue = formik.values[field[0]][field[1]].toLowerCase()
    if (!currentValidValues.includes(currentSelectdValue)) {
      // formik.setFieldValue(field, '', false)
      formik.values[field[0]][field[1]] = ''
    }
  }

  return item
}

export const updateValidationsAndFilters = (sections, data, formik) => {
  return sections.map((section, index) => {
    // last section is custom fields
    if (index === sections.length - 1) {
      section = {
        ...section,
        rows: section.rows.map(r => ({ ...r, items: r.items.map(item => enableItemAndFilter(item, data, formik)) })),
      }
    }
    return section
  })
}

export default getFormConfigWithData
