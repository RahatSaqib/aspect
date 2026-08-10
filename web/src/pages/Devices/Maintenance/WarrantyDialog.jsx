import React from 'react'
import { defineMessages, useIntl } from 'react-intl'
import { getAspectDisplayPreferences } from '../../../components/LocalStorage'
import { BaseDialog } from './BaseDialog'
import useDialogForm from './useDialogForm'

const messages = defineMessages({
  dialogTitle: {
    id: 'pages.WarrantyDialog.dialogTitle',
    defaultMessage: 'Device Warranty',
  },
  warrantyDueDate: {
    id: 'pages.WarrantyDialog.warrantyDueDate',
    defaultMessage: 'Warranty Due Date',
  },
  warrantyDueDateIsRequired: {
    id: 'pages.WarrantyDialog.warrantyDueDateIsRequired',
    defaultMessage: 'Warranty Due Date is required',
  },
})

function validate({ contextDate }, formatMessage) {
  const errors = {}
  if (!contextDate) {
    errors.contextDate = formatMessage(messages.warrantyDueDateIsRequired)
  }
  return errors
}

const WarrantyDialog = ({ device, isDialogActive, onCancel, onSubmit }) => {
  const { formatMessage } = useIntl()
  const { values, meta, form, setFieldValue, handleSubmit } = useDialogForm({
    initialValues: {
      contextDate: device.warrantyDueDate || null,
      notes: device.warrantyNotes || '',
    },
    validate: values => validate(values, formatMessage),
    onSubmit,
  })

  return (
    <BaseDialog
      isDialogActive={isDialogActive}
      onCancel={onCancel}
      dateFormat={getAspectDisplayPreferences().dateFormat}
      labels={{
        dialogTitle: formatMessage(messages.dialogTitle),
        contextDate: formatMessage(messages.warrantyDueDate),
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

export default WarrantyDialog
