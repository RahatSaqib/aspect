import PropTypes from 'prop-types'
import { defineMessages } from 'react-intl'
import React from 'react'
import { compose, setPropTypes, lifecycle, pure } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import MenuItem from '@material-ui/core/MenuItem'

import SelectField from '../../components/shared/SelectField'
import { fetchConsumableReasons } from '../../consumable/ConsumableRedux'

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
  [testConductedReasonI18nKey]: {
    id: `filter.ConsumableReasonSelectField.${testConductedReasonI18nKey}`,
    defaultMessage: 'Test Conducted',
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
    bindActionCreators.bind(null, {
      fetchConsumableReasons,
    })
  ),
  lifecycle({
    componentWillMount() {
      this.setState({
        onChange: ({ target: { value } }) => {
          this.props.onConsumableReasonIdChange(
            value === 'all' ? undefined : value
          )
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
  fetchConsumableReasons,
  consumableReasons,
  onChange,
  ...restProps
}) => (
  <SelectField
    {...restProps}
    onChange={onChange}
    disabled={
      restProps.disabled ||
      consumableReasons.loading ||
      consumableReasons.items.isEmpty()
    }
  >
    {allItemText && <MenuItem value="all">{allItemText}</MenuItem>}
    {consumableReasons.items.map(c => (
      <MenuItem key={c.get('id')} value={c.get('id')}>
        {messages[c.get('i18nKey')]
          ? intl.formatMessage(messages[c.get('i18nKey')])
          : c.get('name')}
      </MenuItem>
    ))}
  </SelectField>
)

export default enhance(ConsumableReasonSelectField)
