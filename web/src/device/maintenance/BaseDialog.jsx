import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { defineMessages } from 'react-intl'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import InputLabel from '@material-ui/core/InputLabel'

import AspectDialog from '../../components/shared/AspectDialog'
import DateTimeInput from '../../components/shared/DateTimeInput'

const cssClasses = classnames.bind(require('./BaseDialog.css'))

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
    valueFromChangeEvent: _.identity,
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
  intl,
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
          {_.has(values, 'contextDate') && (
            <div>
              <InputLabel shrink htmlFor="age-label-placeholder">
                {labels.contextDate}
              </InputLabel>
              <DateTimeInput
                fullWidth
                margin="normal"
                className={cssClasses('DateTime')}
                dateFormat={dateFormat}
                intl={intl}
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
            label={intl.formatMessage(sharedMessages.notes)}
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
