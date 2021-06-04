import classnames from 'classnames/bind'
import React, { useEffect, useState } from 'react'
import { useIntl } from 'react-intl'
import Button from '@material-ui/core/Button'

import AspectDialog from '../../../../components/shared/AspectDialog'
import formConfig from './formConfig'
import { FormikContext, FormikProvider } from '../../../Form/Formik/Context'
import AspectForm from '../../../Form'
import { getDateString } from '../../../../shared/utils/dateFormat'
import { setClassNames, setInitialValue } from '../Helpers'
import messages from './messages'

const cssClasses = classnames.bind(require('./DailyStatusDialog.css'))

const getFormConfig = (formConfig, statuses, data) => {
  setClassNames(formConfig, cssClasses)
  formConfig.sections.forEach(section => {
    setClassNames(section, cssClasses)
    section.rows.forEach(({ items }) => {
      setInitialValue(items, 'startedOn', data.startedOn, cssClasses)
      setInitialValue(items, 'endedOn', data.endedOn, cssClasses)
      setInitialValue(
        items,
        'reason',
        data.maintenanceStatusExternalId,
        cssClasses,
        item => {
          // init dropdown options
          item.controlType.options = statuses
            // show only statuses with manuallySet flag
            .filter(({ manuallySet }) => manuallySet === 1)
            .map(({ externalId, name }) => ({
              label: name,
              value: externalId,
            }))
        }
      )
      setInitialValue(items, 'note', data.note, cssClasses)
    })
  })

  return formConfig
}

const MODE = {
  EDITING: 'EDITING',
  SAVING: 'SAVING',
}
export const DailyStatusDialog = ({
  data = {},
  isOpen,
  onCancel,
  onSubmit,
  statuses,
  title,
  deviceName,
}) => {
  const [mode, setMode] = useState(MODE.EDITING)
  const { formatMessage } = useIntl()

  useEffect(() => {
    if (isOpen) {
      setMode(MODE.EDITING)
    }
  }, [isOpen])

  const onSaveChanges = (deviceId, values) => {
    setMode(MODE.SAVING)
    onSubmit({
      deviceId,
      values: {
        ...values,
        // make sure dates are strings as 'YYYY-MM-DD'
        startedOn: getDateString(values.startedOn),
        endedOn: getDateString(values.endedOn),
      },
    })
  }

  const config = getFormConfig(formConfig, statuses, data)

  return (
    <FormikProvider config={config}>
      <AspectDialog
        actions={[
          <Button
            disabled={mode === MODE.SAVING}
            color="primary"
            onClick={onCancel}
          >
            {formatMessage(messages.cancel)}
          </Button>,
          <FormikContext.Consumer>
            {({ formik }) => (
              <Button
                color="primary"
                disabled={mode === MODE.SAVING || !formik.isValid}
                onClick={() => onSaveChanges(data.deviceId, formik.values)}
                variant="contained"
              >
                {formatMessage(messages.submit)}
              </Button>
            )}
          </FormikContext.Consumer>,
        ]}
        classes={{
          paper: cssClasses('reset-overflow'),
        }}
        dialogContentClasses={{
          root: cssClasses('reset-overflow'),
        }}
        maxWidth="xs"
        open={isOpen}
        onEscapeKeyDown={onCancel}
        onClose={onCancel}
        title={title || formatMessage(messages.title)}
      >
        <div className={cssClasses('Form__content')}>
          <div className={cssClasses('Form__device-name')}>
            {formatMessage(messages.deviceLabel)}: {deviceName}
          </div>
          <div className={cssClasses('Form__controls')}>
            <AspectForm config={config} />
          </div>
        </div>
      </AspectDialog>
    </FormikProvider>
  )
}

export default DailyStatusDialog
