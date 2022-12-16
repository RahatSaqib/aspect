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
          initialValue: values[source[0]][source[1]] ? [values[source[0]][source[1]]] : [],
          controlType: {
            component: 'select',
            options: customField.items.sort((a, b) => a.order - b.order).map(i => ({ value: i.value, label: i.value })),
          },
        },
      ]
    } else if (customField.controlType === 'textBox' && customField.fieldType === 'text') {
      row.items = [
        ...row.items,
        {
          id: customField.source,
          controlType: { component: 'textField' },
          label: customField.title,
        },
      ]
    } else if (customField.controlType === 'textBox' && customField.fieldType === 'number') {
      row.items = [
        ...row.items,
        {
          id: customField.source,
          controlType: {
            component: 'numberField',
            min: customField.validation[0].min,
            max: customField.validation[0].max,
          },
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

export default getFormConfigWithData
