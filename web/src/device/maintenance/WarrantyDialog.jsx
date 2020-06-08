import React, { useState, useEffect } from 'react'
import _ from 'lodash'
import { defineMessages } from 'react-intl'

import recomposeForm from '../../components/recomposeForm'
import { SHARED_DEFAULT_VALUES, sharedFields, BaseDialog } from './BaseDialog'
import { withDateFormatProps } from '../../shared/utils/dateFormat'

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

export function validate({ contextDate }, { intl }) {
  const errors = {}
  if (!contextDate) {
    errors.contextDate = intl.formatMessage(messages.warrantyDueDateIsRequired)
  }
  return errors
}

const DEFAULT_VALUES = _.pick(SHARED_DEFAULT_VALUES, ['contextDate', 'notes'])

const warrantyDialog = WrappedComponent => props => {
  const [values, setValues] = useState({})
  const { device, intl } = props

  useEffect(
    () =>
      setValues({
        ...DEFAULT_VALUES,
        contextDate: device.get('warrantyDueDate') || null,
        notes: device.get('warrantyNotes'),
      }),
    [device]
  )

  const allProps = {
    ...props,
    labels: {
      dialogTitle: intl.formatMessage(messages.dialogTitle),
      contextDate: intl.formatMessage(messages.warrantyDueDate),
    },
    onChange: values => setValues(values),
    values,
  }

  return <WrappedComponent {...allProps} />
}

export default _.flowRight(
  React.memo,
  withDateFormatProps,
  warrantyDialog,
  recomposeForm({
    fields: [sharedFields.contextDate, sharedFields.notes],
    validate,
  })
)(BaseDialog)
