import React, { useState, useEffect } from 'react'
import _ from 'lodash'
import { defineMessages } from 'react-intl'

import recomposeForm from '../../components/recomposeForm'
import { SHARED_DEFAULT_VALUES, sharedFields, BaseDialog } from './BaseDialog'
import { withDateFormatProps } from '../../shared/utils/dateFormat'

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

export function validate({ contextDate }, { intl }) {
  const errors = {}
  if (!contextDate) {
    errors.contextDate = intl.formatMessage(messages.calibrationDateIsRequired)
  }
  return errors
}

const DEFAULT_VALUES = _.pick(SHARED_DEFAULT_VALUES, ['contextDate', 'notes'])

const calibrationDialog = WrappedComponent => props => {
  const [values, setValues] = useState({})
  const { device, intl } = props

  useEffect(
    () =>
      setValues({
        ...DEFAULT_VALUES,
        contextDate: device.get('calibrationDate') || null,
        notes: device.get('calibrationNotes'),
      }),
    [device]
  )

  const allProps = {
    ...props,
    labels: {
      dialogTitle: intl.formatMessage(messages.dialogTitle),
      contextDate: intl.formatMessage(messages.calibrationDate),
    },
    onChange: values => setValues(values),
    values,
  }

  return <WrappedComponent {...allProps} />
}

export default _.flowRight(
  React.memo,
  withDateFormatProps,
  calibrationDialog,
  recomposeForm({
    fields: [sharedFields.contextDate, sharedFields.notes],
    validate,
  })
)(BaseDialog)
