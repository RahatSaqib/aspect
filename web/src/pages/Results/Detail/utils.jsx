import uniqBy from 'lodash/uniqBy'
import { getInitialValuesFromFormConfig, mergeFormConfigWithData } from '../../../components/Form/Formik/Helpers'
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
  const totalCustomFields = values.customFields?.length || 0
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
  uniqBy(values.customFields, elem => elem.source).forEach((customField, index) => {
    if (index % cellsPerRow === 0) {
      // Start new row
      if (index > 0) {
        // Add a new row
        rows = [...rows, row]
      }

      // Init new row
      row = {
        id: id + index,
        items: [],
      }
    }

    row.items = [
      ...row.items,
      {
        // Aspect uses the ID to get the value of the field - custom fields defines the path in the 'source' prop
        id: customField.source,
        controlType: {
          component: 'textField',
        },
        type: 'readOnly',
        label: customField.title,
      },
    ]
  })

  // Add the last row
  rows = [...rows, row]

  return rows
}

export default getFormConfigWithData
