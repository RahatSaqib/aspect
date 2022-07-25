// Imports from packages
import omit from 'lodash/omit'
import flowRight from 'lodash/flowRight'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

// Material-UI
import MenuItem from '@material-ui/core/MenuItem'

// Our imports
import SelectField from '../../components/shared/SelectField'
import { fetchConsumables, ConsumableItems } from '../../consumable/ConsumableRedux'

export class ConsumableSelectField extends PureComponent {
  static propTypes = {
    allItemText: PropTypes.string,
    fetchConsumables: PropTypes.func.isRequired,
    consumableItems: PropTypes.objectOf(ConsumableItems),
    onConsumableChange: PropTypes.func.isRequired,
    value: PropTypes.string,
  }

  static defaultProps = {
    allItemText: 'All',
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
    ])

    return (
      <SelectField {...restProps} value={value} onChange={this.handleChange}>
        {allItemText && <MenuItem value="all">{allItemText}</MenuItem>}
        {consumableItems.map(a => (
          <MenuItem key={a.get('id')} value={a.get('id')}>
            {a.get('name')}
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

export default flowRight(connect(mapStateToProps, mapDispatchToProps))(ConsumableSelectField)
