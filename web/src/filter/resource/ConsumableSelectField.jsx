// Imports from packages
import _ from 'lodash'
import React, { PureComponent, PropTypes } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

// Material-UI
import SelectField from 'material-ui/SelectField'
import MenuItem from 'material-ui/MenuItem'

import { fetchConsumables } from '../../consumable/ConsumableRedux'

export class ConsumableSelectField extends PureComponent {

  static propTypes = {
    allItemText: PropTypes.string,
    fetchConsumables: PropTypes.func.isRequired,
    consumableItems: PropTypes.object,
    onConsumableChange: PropTypes.func.isRequired,
    value: PropTypes.string
  }

  static defaultProps = {
    allItemText: 'All',
    consumableItems: {},
    value: ''
  }

  componentDidMount() {
    const { fetchConsumables } = this.props
    fetchConsumables(false)
  }

  handleChange = (event, index, value) => {
    this.props.onConsumableChange(index === 0 ? undefined : value)
  }

  render() {
    const { allItemText, consumableItems, value } = this.props
    const restProps = _.omit(this.props, [
      'allItemText', 'fetchConsumables', 'consumableItems', 'onConsumableChange', 'value'
    ])

    return (
      <SelectField
        {...restProps}
        value={value}
        onChange={this.handleChange}
      >
        {allItemText && (
          <MenuItem
            value="all"
            primaryText={allItemText}
          />
        )}
        {consumableItems.map(c => (
          <MenuItem key={c.get('id')} value={c.get('id')} primaryText={c.get('name')} />
        ))}
      </SelectField>
    )
  }
}

function mapStateToProps(state) {
  return {
    consumableItems: state.consumable.consumables.items
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    fetchConsumables
  }, dispatch)
}

export default _.flowRight(
  connect(mapStateToProps, mapDispatchToProps)
)(ConsumableSelectField)
