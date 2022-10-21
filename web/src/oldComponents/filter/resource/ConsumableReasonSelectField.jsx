import React from 'react'
import { MenuItem } from '@mui/material'
import PropTypes from 'prop-types'
import { defineMessages } from 'react-intl'
import { connect } from 'react-redux'
import { compose, setPropTypes, lifecycle, pure } from 'recompose'
import { fetchConsumableReasons } from '../../../store/ConsumableRedux'
import SelectField from '../../shared/SelectField'

export const testConductedReasonI18nKey = 'ConsumableReason_TestConducted'

const messages = defineMessages({
  ConsumableReason_Expired: {
    id: 'filter.ConsumableReasonSelectField.ConsumableReason_Expired',
    defaultMessage: 'Expired',
  },
  ConsumableReason_Lost: {
    id: 'filter.ConsumableReasonSelectField.ConsumableReason_Lost',
    defaultMessage: 'Lost',
  },
  ConsumableReason_Stolen: {
    id: 'filter.ConsumableReasonSelectField.ConsumableReason_Stolen',
    defaultMessage: 'Stolen',
  },
  ConsumableReason_AssertedZeroInventory: {
    id: 'filter.ConsumableReasonSelectField.ConsumableReason_AssertedZeroInventory',
    defaultMessage: 'Asserted zero inventory',
  },

  ConsumableReason_TransferSent: {
    id: 'filter.ConsumableReasonSelectField.ConsumableReason_TransferSent',
    defaultMessage: 'Transfer Sent',
  },
  ConsumableReason_TransferReceived: {
    id: 'filter.ConsumableReasonSelectField.ConsumableReason_TransferReceived',
    defaultMessage: 'Transfer Received',
  },

  ConsumableReason_Imported: {
    id: 'filter.ConsumableReasonSelectField.ConsumableReasonImported',
    defaultMessage: 'Imported',
  },
  ConsumableReason_Captured: {
    id: 'filter.ConsumableReasonSelectField.ConsumableReason_Captured',
    defaultMessage: 'Captured',
  },
  ConsumableReason_TestConducted: {
    id: `filter.ConsumableReasonSelectField.ConsumableReason_TestConducted`,
    defaultMessage: 'Test Conducted',
  },
  ConsumableReason_Damage: {
    id: `filter.ConsumableReasonSelectField.ConsumableReason_Damage`,
    defaultMessage: 'Damage',
  },
})

const enhance = compose(
  pure,
  setPropTypes({
    allItemText: PropTypes.string,
    intl: PropTypes.object.isRequired,
    onConsumableReasonIdChange: PropTypes.func.isRequired,
    value: PropTypes.string,
  }),
  connect(
    state => ({
      consumableReasons: state.consumable.consumableReasons,
    }),
    {
      fetchConsumableReasons,
    }
  ),
  lifecycle({
    UNSAFE_componentWillMount() {
      this.setState({
        onChange: ({ target: { value } }) => {
          this.props.onConsumableReasonIdChange(value === 'all' ? undefined : value)
        },
      })
    },

    componentDidMount() {
      this.props.fetchConsumableReasons()
    },
  })
)

export const ConsumableReasonSelectField = ({
  allItemText,
  intl,
  consumableReasons,
  onChange,
  // to remove from restProps
  onConsumableReasonIdChange,
  fetchConsumableReasons,
  ...restProps
}) => (
  <SelectField
    {...restProps}
    onChange={onChange}
    disabled={restProps.disabled || consumableReasons.loading || consumableReasons.items.isEmpty()}
  >
    {allItemText && <MenuItem value="all">{allItemText}</MenuItem>}
    {consumableReasons.items.map(c => (
      <MenuItem key={c.get('id')} value={c.get('id')}>
        {messages[c.get('i18nKey')] ? intl.formatMessage(messages[c.get('i18nKey')]) : c.get('name')}
      </MenuItem>
    ))}
  </SelectField>
)

export default enhance(ConsumableReasonSelectField)
