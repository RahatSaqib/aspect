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
    fetchConsumables: PropTypes.func.isRequired,
    consumables: PropTypes.object,
    onConsumableChange: PropTypes.func.isRequired,
    value: PropTypes.string
  }

  componentDidMount() {
    const { consumables } = this.props
    this.props.fetchConsumables(false, consumables)
  }

  handleChange = (event, index, value) => {
    this.props.onConsumableChange(value)
  }

  render() {
    const { consumables, value } = this.props
    const restProps = _.omit(this.props, [
      'fetchConsumables', 'consumable', 'onConsumableChange', 'value'
    ])

    return (
      <SelectField
        {...restProps}
        value={value}
        onChange={this.handleChange}
      >
        {consumables.map(c => (
          <MenuItem key={c.get('id')} value={c.get('id')} primaryText={c.get('name')} />
        ))}
      </SelectField>
    )
  }
}

function mapStateToProps(state) {
  return {
    consumables: state.consumable
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
