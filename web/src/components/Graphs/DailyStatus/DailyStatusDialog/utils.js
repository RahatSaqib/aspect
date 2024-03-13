import mapValues from 'lodash/mapValues'
import { setInitialValue } from '../Helpers'
import styles from './DailyStatusDialog.module.css'

export const MODE = {
  EDITING: 'EDITING',
  SAVING: 'SAVING',
}

export const getFormConfig = (formConfig, statuses, data) => {
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
      setInitialValue(items, 'note', data.note, styles)
    })
  })

  return formConfig
}
