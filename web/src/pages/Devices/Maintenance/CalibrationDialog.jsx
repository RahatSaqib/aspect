import React from 'react'
import { defineMessages, useIntl } from 'react-intl'
import { getAspectDisplayPreferences } from '../../../components/LocalStorage'
import { BaseDialog } from './BaseDialog'
import useDialogForm from './useDialogForm'

const messages = defineMessages({
  dialogTitle: {
    id: 'pages.CalibrationDialog.dialogTitle',
    defaultMessage: 'Device Calibration',
  },
  calibrationDate: {
    id: 'pages.CalibrationDialog.calibrationDate',
    defaultMessage: 'Calibration Date',
  },
  calibrationDateIsRequired: {
    id: 'pages.WarrantyDialog.calibrationDateIsRequired',
    defaultMessage: 'Calibration Date is required',
  },
})

function validate({ contextDate }, formatMessage) {
  const errors = {}
  if (!contextDate) {
    errors.contextDate = formatMessage(messages.calibrationDateIsRequired)
  }
  return errors
}

const CalibrationDialog = ({ device, isDialogActive, onCancel, onSubmit }) => {
  const { formatMessage } = useIntl()
  const { values, meta, form, setFieldValue, handleSubmit } = useDialogForm({
    initialValues: {
      contextDate: device.calibrationDate || null,
      notes: device.calibrationNotes || '',
    },
    validate: values => validate(values, formatMessage),
    onSubmit,
  })

  return (
    <BaseDialog
      isDialogActive={isDialogActive}
      onCancel={onCancel}
      dateFormat={getAspectDisplayPreferences().get('dateFormat')}
      labels={{
        dialogTitle: formatMessage(messages.dialogTitle),
        contextDate: formatMessage(messages.calibrationDate),
      }}
      form={form}
      values={values}
      meta={meta}
      onContextDateChange={setFieldValue('contextDate')}
      onNotesChange={event => setFieldValue('notes')(event.target.value)}
      handleSubmit={handleSubmit}
    />
  )
}

export default CalibrationDialog
