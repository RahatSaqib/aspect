import React from 'react'
import { Button, TextField } from '@mui/material'
import { DesktopDatePicker } from '@mui/x-date-pickers'
import format from 'date-fns/format'
import { defineMessages, useIntl } from 'react-intl'
import DeviceMaintenanceStatusSelectField from '../../../components/resource/DeviceMaintenanceStatusSelectField'
import AspectDialog from '../../../components/shared/AspectDialog'
import styles from './BaseDialog.module.css'
import useDialogForm from './useDialogForm'

const messages = defineMessages({
  dialogTitle: {
    id: 'pages.MaintenanceStatusDialog.dialogTitle',
    defaultMessage: 'Device Maintenance',
  },
  cancel: {
    id: 'pages.MaintenanceStatusDialog.cancel',
    defaultMessage: 'Cancel',
  },
  submit: {
    id: 'pages.MaintenanceStatusDialog.submit',
    defaultMessage: 'Submit',
  },
  notes: {
    id: 'pages.MaintenanceStatusDialog.notes',
    defaultMessage: 'Notes',
  },
  maintenanceStatus: {
    id: 'pages.MaintenanceStatusDialog.maintenanceStatus',
    defaultMessage: 'Maintenance status',
  },
  maintenanceStatusIsRequired: {
    id: 'pages.MaintenanceStatusDialog.maintenanceStatusIsRequired',
    defaultMessage: 'Maintenance status is required',
  },
  expectedBack: {
    id: 'pages.MaintenanceStatusDialog.expectedBack',
    defaultMessage: 'Expect Back Online',
  },
})

function validate({ maintenanceStatus }, formatMessage) {
  const errors = {}
  if (!maintenanceStatus) {
    errors.contextDate = formatMessage(messages.maintenanceStatusIsRequired)
  }
  return errors
}

const DeviceMaintenanceStatusDialog = ({ device, isDialogActive, onCancel, onSubmit }) => {
  const { formatMessage } = useIntl()
  const { values, meta, form, setFieldValue, handleSubmit } = useDialogForm({
    initialValues: {
      maintenanceStatus: device.maintenanceStatus || null,
      notes: device.maintenanceStatusNotes || null,
      expectedBack: device.expectedBackOnline || null,
    },
    validate: values => validate(values, formatMessage),
    onSubmit,
  })

  return (
    <AspectDialog
      actions={[
        <Button color="primary" onClick={onCancel}>
          {formatMessage(messages.cancel)}
        </Button>,
        <Button
          color="primary"
          variant="contained"
          disabled={form.pristine || !form.valid || form.submitting}
          onClick={handleSubmit}
        >
          {formatMessage(messages.submit)}
        </Button>,
      ]}
      maxWidth="sm"
      open={isDialogActive}
      onClose={onCancel}
      title={formatMessage(messages.dialogTitle)}
    >
      <form className={styles.Form}>
        <div className={styles.Form__Content}>
          <section>
            <div>
              <DeviceMaintenanceStatusSelectField
                value={values.maintenanceStatus || ''}
                onDeviceMaintenanceStatusChange={setFieldValue('maintenanceStatus')}
                floatingLabelText={formatMessage(messages.maintenanceStatus)}
                fullWidth
                helperText={meta.maintenanceStatus.touched && meta.maintenanceStatus.error}
                onlyManuallySetableStatuses
              />
            </div>
          </section>
          <section>
            <TextField
              fullWidth
              type="notes"
              name="notes"
              label={formatMessage(messages.notes)}
              disabled={form.submitting}
              value={values.notes || ''}
              onChange={event => setFieldValue('notes')(event.target.value)}
              multiline
              rows={2}
              error={meta.notes.touched && meta.notes.error}
              helperText={meta.notes.touched && meta.notes.error}
              margin="normal"
              FormHelperTextProps={{
                margin: 'dense',
              }}
              inputProps={{ maxLength: 2000 }}
            />
          </section>
          <section>
            <DesktopDatePicker
              label={formatMessage(messages.expectedBack)}
              name="expectedBack"
              type="expectedBack"
              value={values.expectedBack}
              minDate={new Date()}
              disabled={values.maintenanceStatus === 'reportedActive' || form.submitting}
              onChange={date => {
                setFieldValue('expectedBack')(format(date, 'yyyy-MM-dd'))
              }}
              renderInput={params => <TextField {...params} onKeyDown={e => e.preventDefault()} />}
            />
          </section>
        </div>
      </form>
    </AspectDialog>
  )
}

export default DeviceMaintenanceStatusDialog
