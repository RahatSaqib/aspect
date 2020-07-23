import React, { useState, useEffect } from 'react'
import _ from 'lodash'
import { defineMessages } from 'react-intl'

import classnames from 'classnames/bind'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import DeviceMaintenanceStatusSelectField from '../../filter/resource/DeviceMaintenanceStatusSelectField'
import recomposeForm from '../../components/recomposeForm'

import AspectDialog from '../../components/shared/AspectDialog'

const cssClasses = classnames.bind(require('./BaseDialog.css'))

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
})

export function validate({ contextDate }, { intl }) {
  const errors = {}
  /* if (!contextDate) {
    errors.contextDate = intl.formatMessage(messages.calibrationDateIsRequired)
  } */
  return errors
}

const deviceMaintenanceStatusDialog = WrappedComponent => props => {
  const [values, setValues] = useState({})
  const { device, intl } = props

  useEffect(
    () =>
      setValues({
        maintenanceStatusId: device.get('maintenanceStatusId') || null,
        notes: device.get('calibrationNotes') || null,
      }),
    [device]
  )

  const allProps = {
    ...props,
    labels: {
      dialogTitle: intl.formatMessage(messages.dialogTitle),
    },
    onChange: values => {
      setValues(values)
    },
    values,
  }
  return <WrappedComponent {...allProps} />
}

const FormDialog = ({
  intl,
  isDialogActive,
  onCancel,
  // --- injected by recompose ---
  labels,
  form,
  values,
  meta,
  onMaintenanceStatusIdChange,
  onNotesChange,
  handleSubmit,
}) => (
  <AspectDialog
    actions={[
      <Button color="primary" onClick={onCancel}>
        {intl.formatMessage(messages.cancel)}
      </Button>,
      <Button
        color="primary"
        variant="contained"
        disabled={form.pristine || !form.valid || form.submitting}
        onClick={handleSubmit}
      >
        {intl.formatMessage(messages.submit)}
      </Button>,
    ]}
    maxWidth="sm"
    open={isDialogActive}
    onEscapeKeyDown={onCancel}
    onClose={onCancel}
    title={labels.dialogTitle}
  >
    <form className={cssClasses('Form')}>
      <div className={cssClasses('Form__Content')}>
        <section>
          <div>
            <DeviceMaintenanceStatusSelectField
              value={values.maintenanceStatusId}
              onMaintenanceStatusIdChange={onMaintenanceStatusIdChange}
              floatingLabelText={intl.formatMessage(messages.maintenanceStatus)}
              fullWidth
              helperText={
                meta.maintenanceStatusId.touched &&
                meta.maintenanceStatusId.error
              }
            />
          </div>
        </section>
        <section>
          <TextField
            fullWidth
            type="notes"
            name="notes"
            label={intl.formatMessage(messages.notes)}
            disabled={form.submitting}
            value={values.notes}
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
      </div>
    </form>
  </AspectDialog>
)

export default _.flowRight(
  React.memo,
  deviceMaintenanceStatusDialog,
  recomposeForm({
    fields: [
      {
        fieldName: 'maintenanceStatusId',
        valueFromChangeEvent: it => it,
      },
      {
        fieldName: 'notes',
        valueFromChangeEvent: it => it.target.value,
      },
    ],
    validate,
  })
)(FormDialog)
