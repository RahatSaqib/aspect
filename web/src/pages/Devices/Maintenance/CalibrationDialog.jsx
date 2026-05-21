import React, { useState } from 'react'
import flowRight from 'lodash/flowRight'
import pick from 'lodash/pick'
import { defineMessages, useIntl } from 'react-intl'
import recomposeForm from '../../../components/recomposeForm'
import { withDateFormatProps } from '../../../utils/utils/dateFormat'
import { SHARED_DEFAULT_VALUES, sharedFields, BaseDialog } from './BaseDialog'

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

function validate({ contextDate }, { formatMessage }) {
  const errors = {}
  if (!contextDate) {
    errors.contextDate = formatMessage(messages.calibrationDateIsRequired)
  }
  return errors
}

const DEFAULT_VALUES = pick(SHARED_DEFAULT_VALUES, ['contextDate', 'notes'])

const calibrationDialog = WrappedComponent => props => {
  const { formatMessage } = useIntl()
  const { device } = props
  const [values, setValues] = useState({
    ...DEFAULT_VALUES,
    contextDate: device.get('calibrationDate') || null,
    notes: device.get('calibrationNotes') || '',
  })

  const allProps = {
    ...props,
    labels: {
      dialogTitle: formatMessage(messages.dialogTitle),
      contextDate: formatMessage(messages.calibrationDate),
    },
    onChange: values => setValues(values),
    values,
  }

  return <WrappedComponent {...allProps} />
}

export default flowRight(
  React.memo,
  withDateFormatProps,
  calibrationDialog,
  recomposeForm({
    fields: [sharedFields.contextDate, sharedFields.notes],
    validate,
  })
)(BaseDialog)
