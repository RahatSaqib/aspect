import _ from 'lodash'
import { compose, withProps, lifecycle, pure } from 'recompose'
import { defineMessages } from 'react-intl'

import recomposeForm from '../../components/recomposeForm'
import {
  SHARED_DEFAULT_VALUES,
  sharedFields,
  withTodayProps,
  BaseDialogForm,
} from './BaseDialogForm'

const messages = defineMessages({
  dialogTitle: {
    id: 'pages.WarrantyDialogForm.dialogTitle',
    defaultMessage: 'Device Warranty',
  },
  warrantyDueDate: {
    id: 'pages.WarrantyDialogForm.warrantyDueDate',
    defaultMessage: 'Warranty Due Date',
  },
  warrantyDueDateIsRequired: {
    id: 'pages.WarrantyDialogForm.warrantyDueDateIsRequired',
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

const enhance = compose(
  pure,
  withTodayProps,
  lifecycle({
    componentWillMount() {
      const { device } = this.props
      this.setState({
        onChange: values => this.setState({ values }),
        values: {
          ...DEFAULT_VALUES,
          contextDate: device.get('warrantyDueDate'),
          notes: device.get('warrantyNotes'),
        },
      })
    },
  }),
  withProps(({ intl }) => ({
    labels: {
      dialogTitle: intl.formatMessage(messages.dialogTitle),
      contextDate: intl.formatMessage(messages.warrantyDueDate),
    },
  })),
  recomposeForm({
    fields: [sharedFields.contextDate, sharedFields.notes],
    validate,
  })
)

export default enhance(BaseDialogForm)
