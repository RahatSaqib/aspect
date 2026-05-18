import React, { useEffect, useState } from 'react'
import { Button, CircularProgress } from '@mui/material'
import { useFormikContext } from 'formik'
import { useIntl } from 'react-intl'
import * as Yup from 'yup'
import AspectDialog from '../../../../components/shared/AspectDialog'
import AspectForm from '../../../Form'
import { FormikProvider } from '../../../Form/Formik/Context'
import styles from './DailyStatusDialog.module.css'
import formConfig from './formConfig'
import messages from './messages'
import SiteInfo from './SiteInfo'
import { MODE, getFormConfig } from './utils'

const validationSchema = (manualStatuses, initialReasonValue) => {
  return Yup.object().shape({
    reason: Yup.string()
      .test('is-manually-set', value => {
        if (initialReasonValue === 'inactiveNoTestsPerformed' && value === 'reportedActive') {
          throw new Yup.ValidationError(
            "You cannot change the status of a device to 'Reported Active' for days when it was reported as 'No Tests Performed'",
            value,
            'reason'
          )
        }
        if (!manualStatuses.includes(value)) {
          throw new Yup.ValidationError('This status cannot be set manually', value, 'reason')
        }
        return true
      })
      .required(),
  })
}
const DailyStatusDialog = ({ data, onCancel, onSubmit, statuses, manualStatuses, title, deviceName, siteProps }) => {
  const [form, setForm] = useState(false)
  useEffect(() => {
    if (data) {
      const manuallySetStatuses = manualStatuses.map(status => status.externalId)
      const schema = validationSchema(manuallySetStatuses, data.maintenanceStatusExternalId)
      const config = getFormConfig(formConfig, statuses, data, schema, {
        ...data,
        reason: data.maintenanceStatusExternalId,
      })
      setForm(config)
    }
  }, [data, statuses, manualStatuses])

  return !form ? (
    <CircularProgress />
  ) : (
    <FormikProvider config={form}>
      <DailyStatusForm
        formConfig={formConfig}
        onSubmit={onSubmit}
        onCancel={onCancel}
        title={title}
        data={data}
        deviceName={deviceName}
        siteProps={siteProps}
      />
    </FormikProvider>
  )
}

const DailyStatusForm = ({ formConfig, data = {}, onCancel, onSubmit, title, deviceName, siteProps }) => {
  const [mode, setMode] = useState(MODE.EDITING)
  const { formatMessage } = useIntl()
  const { formik } = useFormikContext()

  const closeDialog = () => {
    formik.resetForm()
    onCancel()
  }
  const onSaveChanges = (deviceId, values) => {
    setMode(MODE.SAVING)
    formik.setSubmitting(true)
    onSubmit({
      deviceId,
      onSuccess: () => formik.setSubmitting(false),
      values: {
        ...values,
        /**
         * Make sure to use local datetime as-is it returns from DatePicker.
         * Dates are converted into ISO format only on posting to API
         */
        startedOn: new Date(values.startedOn),
        endedOn: new Date(values.endedOn),
        expectedBackOnline: values.reason === 'reportedActive' ? '' : values.expectedBackOnline,
      },
    })
  }
  return (
    <AspectDialog
      actions={[
        <Button disabled={mode === MODE.SAVING} color="primary" onClick={closeDialog}>
          {formatMessage(messages.cancel)}
        </Button>,
        <Button
          color="primary"
          disabled={!formik.dirty || !formik.isValid || formik.isSubmitting}
          onClick={() => {
            onSaveChanges(data.deviceId, formik.values)
            formik.resetForm()
          }}
          variant="contained"
        >
          {formatMessage(messages.submit)}
        </Button>,
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
          <AspectForm config={formConfig} />
        </div>

        <SiteInfo {...siteProps} />
      </div>
    </AspectDialog>
  )
}

export default DailyStatusDialog
