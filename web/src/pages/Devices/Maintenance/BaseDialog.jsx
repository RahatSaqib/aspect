import identity from 'lodash/identity'
import has from 'lodash/has'
import classnames from 'classnames/bind'
import React from 'react'
import { defineMessages } from 'react-intl'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import InputLabel from '@mui/material/InputLabel'

import AspectDialog from '../../../oldComponents/shared/AspectDialog'
import DateTimeInput from '../../../oldComponents/shared/DateTimeInput'
import useI18n from '../../../hooks/useI18n'

import styles from './BaseDialog.css'

const cssClasses = classnames.bind(styles)

export const sharedMessages = defineMessages({
  notes: {
    id: 'pages.BaseDialog.notes',
    defaultMessage: 'Notes',
  },
})

export const SHARED_DEFAULT_VALUES = {
  contextDate: undefined,
  notes: '',
}

export const sharedFields = {
  contextDate: {
    fieldName: 'contextDate',
    valueFromChangeEvent: identity,
  },
  notes: {
    fieldName: 'notes',
    valueFromChangeEvent: it => it.target.value,
  },
}

export const messages = defineMessages({
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
  // --- injected by recompose ---
  dateFormat,
  labels,
  form,
  values,
  meta,
  onContextDateChange,
  onNotesChange,
  handleSubmit,
}) => {
  const { formatMessage } = useI18n()
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
      <form className={cssClasses('Form')}>
        <div className={cssClasses('Form__Content')}>
          <section>
            {has(values, 'contextDate') && (
              <div>
                <InputLabel shrink htmlFor="age-label-placeholder">
                  {labels.contextDate}
                </InputLabel>
                <DateTimeInput
                  fullWidth
                  margin="normal"
                  className={cssClasses('DateTime')}
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
