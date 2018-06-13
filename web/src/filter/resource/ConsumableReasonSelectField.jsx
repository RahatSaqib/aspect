import PropTypes from 'prop-types'
import { defineMessages } from 'react-intl'
import React from 'react'
import { compose, setPropTypes, lifecycle, pure } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import SelectField from 'material-ui/SelectField'
import MenuItem from 'material-ui/MenuItem'

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
        onChange: (event, index, value) => {
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
  onConsumableReasonIdChange,
  ...restProps
}) => (
  <SelectField
    {...restProps}
    disabled={
      restProps.disabled ||
      consumableReasons.loading ||
      consumableReasons.items.isEmpty()
    }
  >
    {allItemText && <MenuItem value="all" primaryText={allItemText} />}
    {consumableReasons.items.map(c => (
      <MenuItem
        key={c.get('id')}
        value={c.get('id')}
        primaryText={
          messages[c.get('i18nKey')]
            ? intl.formatMessage(messages[c.get('i18nKey')])
            : c.get('name')
        }
      />
    ))}
  </SelectField>
)

export default enhance(ConsumableReasonSelectField)
