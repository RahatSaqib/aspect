import React, { useState } from 'react'
import pick from 'lodash/pick'
import flowRight from 'lodash/flowRight'
import { defineMessages } from 'react-intl'

import recomposeForm from '../../../oldComponents/recomposeForm'
import { SHARED_DEFAULT_VALUES, sharedFields, BaseDialog } from './BaseDialog'
import { withDateFormatProps } from '../../../utils/utils/dateFormat'
import useI18n from '../../../hooks/i18n/useI18n'

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

export function validate({ contextDate }, { formatMessage }) {
  const errors = {}
  if (!contextDate) {
    errors.contextDate = formatMessage(messages.warrantyDueDateIsRequired)
  }
  return errors
}

const DEFAULT_VALUES = pick(SHARED_DEFAULT_VALUES, ['contextDate', 'notes'])

const warrantyDialog = WrappedComponent => props => {
  const { formatMessage } = useI18n()
  const { device } = props
  const [values, setValues] = useState({
    ...DEFAULT_VALUES,
    contextDate: device.get('warrantyDueDate') || null,
    notes: device.get('warrantyNotes') || '',
  })

  const allProps = {
    ...props,
    labels: {
      dialogTitle: formatMessage(messages.dialogTitle),
      contextDate: formatMessage(messages.warrantyDueDate),
    },
    onChange: values => setValues(values),
    values,
  }

  return <WrappedComponent {...allProps} />
}

export default flowRight(
  React.memo,
  withDateFormatProps,
  warrantyDialog,
  recomposeForm({
    fields: [sharedFields.contextDate, sharedFields.notes],
    validate,
  })
)(BaseDialog)
