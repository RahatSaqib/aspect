import React, { useState, useEffect } from 'react'
import { Button, TextField } from '@mui/material'
import { DesktopDatePicker } from '@mui/x-date-pickers'
import format from 'date-fns/format'
import flowRight from 'lodash/flowRight'
import { defineMessages, useIntl } from 'react-intl'
import recomposeForm from '../../../components/recomposeForm'
import DeviceMaintenanceStatusSelectField from '../../../components/resource/DeviceMaintenanceStatusSelectField'
import AspectDialog from '../../../components/shared/AspectDialog'
import styles from './BaseDialog.module.css'

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

function validate({ maintenanceStatus }, { formatMessage }) {
  const errors = {}
  if (!maintenanceStatus) {
    errors.contextDate = formatMessage(messages.maintenanceStatusIsRequired)
  }
  return errors
}

const deviceMaintenanceStatusDialog = WrappedComponent => props => {
  const [values, setValues] = useState(false)
  const { device } = props
  const { formatMessage } = useIntl()

  useEffect(() => {
    if (!values) {
      setValues({
        maintenanceStatus: device.get('maintenanceStatus') || null,
        notes: device.get('maintenanceStatusNotes') || null,
        expectedBack: device.get('expectedBackOnline') || null,
      })
    }
  }, [device, values])

  const allProps = {
    ...props,
    labels: {
      dialogTitle: formatMessage(messages.dialogTitle),
    },
    onChange: values => {
      setValues(values)
    },
    values,
  }
  return <WrappedComponent {...allProps} />
}

const FormDialog = ({
  isDialogActive,
  onCancel,
  // --- injected by recompose ---
  labels,
  form,
  values,
  meta,
  onMaintenanceStatusChange,
  onNotesChange,
  handleSubmit,
  onExpectedBackChange,
}) => {
  const { formatMessage } = useIntl()
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
      title={labels.dialogTitle}
    >
      <form className={styles.Form}>
        <div className={styles.Form__Content}>
          <section>
            <div>
              <DeviceMaintenanceStatusSelectField
                value={values.maintenanceStatus || ''}
                onDeviceMaintenanceStatusChange={onMaintenanceStatusChange}
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
              onChange={onNotesChange}
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
                onExpectedBackChange(format(date, 'yyyy-MM-dd'))
              }}
              renderInput={params => <TextField {...params} onKeyDown={e => e.preventDefault()} />}
            />
          </section>
        </div>
      </form>
    </AspectDialog>
  )
}

export default flowRight(
  React.memo,
  deviceMaintenanceStatusDialog,
  recomposeForm({
    fields: [
      {
        fieldName: 'maintenanceStatus',
        valueFromChangeEvent: it => it,
      },
      {
        fieldName: 'notes',
        valueFromChangeEvent: it => it.target.value,
      },
      {
        fieldName: 'expectedBack',
        valueFromChangeEvent: it => it,
      },
    ],
    validate,
  })
)(FormDialog)
