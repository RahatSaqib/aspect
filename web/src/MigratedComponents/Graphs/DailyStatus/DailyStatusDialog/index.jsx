import classnames from 'classnames/bind'
import React, { useEffect, useState } from 'react'
import Button from '@mui/material/Button'

import AspectDialog from '../../../../components/shared/AspectDialog'
import formConfig from './formConfig'
import { FormikProvider } from '../../../Form/Formik/Context'
import AspectForm from '../../../Form'
import ButtonSave from './ButtonSave'
import messages from './messages'
import { MODE, getFormConfig } from './utils'
import styles from './DailyStatusDialog.css'
import { getISOFromString } from '../../../../components/shared/DateTimeInput/utils/date'
import useI18n from '../../../../Hooks/i18n/useI18n'

const cssClasses = classnames.bind(styles)

export const DailyStatusDialog = ({ data = {}, isOpen, onCancel, onSubmit, statuses, title, deviceName }) => {
  const [mode, setMode] = useState(MODE.EDITING)
  const { formatMessage } = useI18n()

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
        startedOn: getISOFromString(values.startedOn),
        endedOn: getISOFromString(values.endedOn),
      },
    })
  }

  const config = getFormConfig(formConfig, statuses, data)

  return (
    <FormikProvider config={config}>
      <AspectDialog
        actions={[
          <Button disabled={mode === MODE.SAVING} color="primary" onClick={onCancel}>
            {formatMessage(messages.cancel)}
          </Button>,
          <ButtonSave deviceId={data.deviceId} onClick={onSaveChanges} mode={mode} />,
        ]}
        classes={{
          paper: cssClasses('reset-overflow'),
        }}
        dialogContentClasses={{
          root: cssClasses('reset-overflow'),
        }}
        maxWidth="xs"
        open={isOpen}
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
