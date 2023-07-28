import classnames from 'classnames/bind'
import { setClassNames, setInitialValue } from '../Helpers'
import styles from './DailyStatusDialog.css'

const cssClasses = classnames.bind(styles)

export const MODE = {
  EDITING: 'EDITING',
  SAVING: 'SAVING',
}

export const getFormConfig = (formConfig, statuses, data) => {
  setClassNames(formConfig, cssClasses)
  formConfig.sections.forEach(section => {
    setClassNames(section, cssClasses)
    section.rows.forEach(({ items }) => {
      setInitialValue(items, 'startedOn', data.startedOn, cssClasses)
      setInitialValue(items, 'endedOn', data.endedOn, cssClasses)
      setInitialValue(items, 'reason', data.maintenanceStatusExternalId, cssClasses, item => {
        // init dropdown options
        item.controlType.options = statuses.map(({ externalId, name }) => ({
          label: name,
          value: externalId,
        }))
      })
      setInitialValue(items, 'note', data.note, cssClasses)
    })
  })

  return formConfig
}
