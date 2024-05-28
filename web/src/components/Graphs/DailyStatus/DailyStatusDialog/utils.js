import mapValues from 'lodash/mapValues'
import { getInitialValuesFromFormConfig, mergeFormConfigWithData } from '../../../Form/Formik/Helpers'
import { setInitialValue } from '../Helpers'
import styles from './DailyStatusDialog.module.css'
import messages from './messages'

export const MODE = {
  EDITING: 'EDITING',
  SAVING: 'SAVING',
}

export const getFormConfig = (formConfig, statuses, data, validationSchema, values) => {
  formConfig.classNames = mapValues(formConfig.classNames, className => styles[className])
  formConfig.sections.forEach(section => {
    section.classNames = mapValues(section.classNames, className => styles[className])
    section.rows.forEach(({ items }) => {
      setInitialValue(items, 'startedOn', data.startedOn, styles)
      setInitialValue(items, 'endedOn', data.endedOn, styles)
      setInitialValue(items, 'reason', data.maintenanceStatusExternalId, styles, item => {
        // init dropdown options
        item.controlType.options = statuses.map(({ externalId, name }) => ({ label: name, value: externalId }))
      })
      setInitialValue(items, 'note', data.note || '', styles)
      setInitialValue(
        items,
        'expectedBackOnline',
        data.expectedBackOnline ? new Date(data.expectedBackOnline) : '',
        styles
      )
    })
  })
  const initialValues = getInitialValuesFromFormConfig(formConfig, values)

  const formWithData = {
    ...mergeFormConfigWithData(initialValues, formConfig, messages),
    validationSchema,
    values: initialValues,
  }
  return formWithData
}
