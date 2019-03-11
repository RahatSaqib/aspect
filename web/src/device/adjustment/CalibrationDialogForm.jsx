import _ from 'lodash'
import { compose, withProps, lifecycle, pure } from 'recompose'
import { defineMessages } from 'react-intl'

import recomposeForm from '../../components/recomposeForm'
import {
  SHARED_DEFAULT_VALUES,
  sharedFields,
  BaseDialogForm,
} from './BaseDialogForm'

const messages = defineMessages({
  dialogTitle: {
    id: 'pages.CalibrationDialogForm.dialogTitle',
    defaultMessage: 'Device Calibration',
  },
  calibrationDate: {
    id: 'pages.CalibrationDialogForm.calibrationDate',
    defaultMessage: 'Calibration Date',
  },
  calibrationDateIsRequired: {
    id: 'pages.WarrantyDialogForm.calibrationDateIsRequired',
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

const enhance = compose(
  pure,
  lifecycle({
    componentWillMount() {
      const { device } = this.props
      this.setState({
        onChange: values => this.setState({ values }),
        values: {
          ...DEFAULT_VALUES,
          contextDate: device.get('calibrationDate'),
          notes: device.get('calibrationNotes'),
        },
      })
    },
  }),
  withProps(({ intl }) => ({
    labels: {
      dialogTitle: intl.formatMessage(messages.dialogTitle),
      contextDate: intl.formatMessage(messages.calibrationDate),
    },
  })),
  recomposeForm({
    fields: [sharedFields.contextDate, sharedFields.notes],
    validate,
  })
)

export default enhance(BaseDialogForm)
