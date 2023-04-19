import React, { PureComponent } from 'react'
import { MenuItem } from '@mui/material'
import flowRight from 'lodash/flowRight'
import omit from 'lodash/omit'
import PropTypes from 'prop-types'
import { injectIntl } from 'react-intl'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { consumableMessages } from '../../messages'
import { fetchConsumables, ConsumableItems } from '../../store/ConsumableRedux'
import PropTypeOf from '../../utils/types'
import SelectField from '../shared/SelectField'

export class ConsumableSelectField extends PureComponent {
  static propTypes = {
    allItemText: PropTypes.string,
    fetchConsumables: PropTypes.func.isRequired,
    consumableItems: PropTypes.objectOf(ConsumableItems),
    onConsumableChange: PropTypes.func.isRequired,
    value: PropTypes.string,
    intl: PropTypeOf.intl.isRequired,
  }

  static defaultProps = {
    allItemText: '',
    consumableItems: null,
    value: '',
  }

  componentDidMount() {
    const { fetchConsumables } = this.props
    fetchConsumables(false)
  }

  handleChange = ({ target: { value } }) => {
    this.props.onConsumableChange(value === 'all' ? undefined : value)
  }

  render() {
    const { allItemText, consumableItems, value } = this.props
    const restProps = omit(this.props, [
      'allItemText',
      'fetchConsumables',
      'consumableItems',
      'onConsumableChange',
      'value',
      'intl',
    ])

    return (
      <SelectField {...restProps} value={value} onChange={this.handleChange}>
        {allItemText ? <MenuItem value="all">{allItemText}</MenuItem> : null}
        {consumableItems.map(a => (
          <MenuItem key={a.get('id')} value={a.get('id')}>
            {this.props.intl.formatMessage(consumableMessages[a.get('i18nKey')])}
          </MenuItem>
        ))}
      </SelectField>
    )
  }
}

function mapStateToProps(state) {
  return {
    consumableItems: state.consumable.consumables.items,
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      fetchConsumables,
    },
    dispatch
  )
}

export default flowRight(injectIntl, connect(mapStateToProps, mapDispatchToProps))(ConsumableSelectField)
