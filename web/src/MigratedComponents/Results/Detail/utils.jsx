import { getInitialValuesFromFormConfig, mergeFormConfigWithData } from '../../Form/Formik/Helpers'

import getFormConfig from '../Forms/editConfig'
import getValidationSchema from '../Forms/validation'
import messages from './messages'

export const getFormConfigWithData = (intl, isNew, values) => {
  const formSchema = getFormConfig(intl.formatMessage, isNew, values.assay)

  const section = formSchema.sections.find(({ id }) => id === 'CustomFields')
  if (section) {
    section.rows = getRowsForCustomFields(values)
  }

  const validationSchema = getValidationSchema(intl.formatMessage)
  const initialValues = getInitialValuesFromFormConfig(formSchema, values)

  return {
    ...mergeFormConfigWithData(initialValues, formSchema, messages),
    validationSchema,
    values: initialValues,
  }
}

function getRowsForCustomFields(values) {
  const totalCustomFields = values.customFieldsValues?.length || 0
  const id = 9000
  let rows = []
  if (totalCustomFields === 0) {
    rows = [
      {
        id,
        items: [
          {
            controlType: {
              component: 'textField',
            },
            labelI18nKey: 'noCustomFieldsDefined',
          },
        ],
      },
    ]
    return rows
  }
  // show 3 cells per row
  const cellsPerRow = 3
  let row = {}
  values.customFieldsValues.forEach((customField, index) => {
    // start new row
    if (index % cellsPerRow === 0) {
      if (index > 0) {
        rows = [...rows, row]
      }
      row = {
        id: id + index,
        items: [],
      }
    }
    row.items = [
      ...row.items,
      {
        id: customField.externalId,
        controlType: {
          component: 'textField',
        },
        type: 'readOnly',
        label: customField.caption,
      },
    ]
  })

  return rows
}

export default getFormConfigWithData
