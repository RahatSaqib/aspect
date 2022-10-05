import React, { useState } from 'react'
import Button from '@mui/material/Button'
import classnames from 'classnames/bind'
import useI18n from '../../../../hooks/useI18n'
import AspectDialog from '../../../../oldComponents/shared/AspectDialog'
import { getISOFromString } from '../../../../oldComponents/shared/DateTimeInput/utils/date'
import AspectForm from '../../../Form'
import { FormikProvider } from '../../../Form/Formik/Context'
import ButtonSave from './ButtonSave'
import styles from './DailyStatusDialog.css'
import formConfig from './formConfig'
import messages from './messages'
import SiteInfo from './SiteInfo'
import { MODE, getFormConfig } from './utils'

const cssClasses = classnames.bind(styles)

export const DailyStatusDialog = ({ data = {}, onCancel, onSubmit, statuses, title, deviceName, siteProps }) => {
  const [mode, setMode] = useState(MODE.EDITING)
  const { formatMessage } = useI18n()

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
        open
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

          <SiteInfo {...siteProps} />
        </div>
      </AspectDialog>
    </FormikProvider>
  )
}

export default DailyStatusDialog
