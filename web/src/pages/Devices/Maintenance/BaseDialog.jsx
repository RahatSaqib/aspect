import React from 'react'
import { Button, InputLabel, TextField } from '@mui/material'
import has from 'lodash/has'
import { defineMessages, useIntl } from 'react-intl'
import AspectDialog from '../../../components/shared/AspectDialog'
import DateTimeInput from '../../../components/shared/DateTimeInput'
import styles from './BaseDialog.module.css'

const sharedMessages = defineMessages({
  notes: {
    id: 'pages.BaseDialog.notes',
    defaultMessage: 'Notes',
  },
})

const messages = defineMessages({
  submit: {
    id: 'pages.BaseDialog.submit',
    defaultMessage: 'Submit',
  },
  cancel: {
    id: 'pages.BaseDialog.cancel',
    defaultMessage: 'Cancel',
  },
})

export const BaseDialog = ({
  isDialogActive,
  onCancel,
  dateFormat,
  labels,
  form,
  values,
  meta,
  onContextDateChange,
  onNotesChange,
  handleSubmit,
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
            {has(values, 'contextDate') && (
              <div>
                <InputLabel shrink htmlFor="age-label-placeholder">
                  {labels.contextDate}
                </InputLabel>
                <DateTimeInput
                  fullWidth
                  margin="normal"
                  className={styles.DateTime}
                  dateFormat={dateFormat}
                  disabled={form.submitting}
                  value={values.contextDate}
                  onChange={onContextDateChange}
                  RootProps={{
                    name: 'contextDate',
                  }}
                  // autoOk
                />
              </div>
            )}
          </section>
          <section>
            <TextField
              fullWidth
              type="notes"
              name="notes"
              label={formatMessage(sharedMessages.notes)}
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
}
