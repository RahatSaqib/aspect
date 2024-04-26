import React, { useState } from 'react'
import { Button } from '@mui/material'
import { useIntl } from 'react-intl'
import AspectDialog from '../../../../oldComponents/shared/AspectDialog'
import AspectForm from '../../../Form'
import { FormikProvider } from '../../../Form/Formik/Context'
import ButtonSave from './ButtonSave'
import styles from './DailyStatusDialog.module.css'
import formConfig from './formConfig'
import messages from './messages'
import SiteInfo from './SiteInfo'
import { MODE, getFormConfig } from './utils'

const DailyStatusDialog = ({ data = {}, onCancel, onSubmit, statuses, title, deviceName, siteProps }) => {
  const [mode, setMode] = useState(MODE.EDITING)
  const { formatMessage } = useIntl()

  const onSaveChanges = (deviceId, values) => {
    setMode(MODE.SAVING)
    onSubmit({
      deviceId,
      values: {
        ...values,
        /**
         * Make sure to use local datetime as-is it returns from DatePicker.
         * Dates are converted into ISO format only on posting to API
         */
        startedOn: new Date(values.startedOn),
        endedOn: new Date(values.endedOn),
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
          paper: styles.reset_overflow,
        }}
        dialogContentClasses={{
          root: styles.reset_overflow,
        }}
        maxWidth="xs"
        open
        onClose={onCancel}
        title={title || formatMessage(messages.title)}
      >
        <div className={styles.Form__content}>
          <div className={styles.Form__device_name}>
            {formatMessage(messages.deviceLabel)}: {deviceName}
          </div>
          <div className={styles.Form__controls}>
            <AspectForm config={config} />
          </div>

          <SiteInfo {...siteProps} />
        </div>
      </AspectDialog>
    </FormikProvider>
  )
}

export default DailyStatusDialog
