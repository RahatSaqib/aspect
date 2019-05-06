import _ from 'lodash'
import { compose, withProps, lifecycle, pure } from 'recompose'
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

const enhance = compose(
  pure,
  withDateFormatProps,
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

export default enhance(BaseDialog)
