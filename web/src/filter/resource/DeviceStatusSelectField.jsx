// Imports from packages
import _ from 'lodash'
import React, { PureComponent, PropTypes } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

// Material-UI
import SelectField from 'material-ui/SelectField'
import MenuItem from 'material-ui/MenuItem'

import { fetchDeviceStatuses } from '../../deviceStatus/DeviceStatusRedux'

export class DeviceStatusSelectField extends PureComponent {

  static propTypes = {
    allItemText: PropTypes.string,
    fetchDeviceStatuses: PropTypes.func.isRequired,
    deviceStatusItems: PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string
    }).isRequired,
    onDeviceStatusChange: PropTypes.func.isRequired,
    value: PropTypes.string
  }

  componentDidMount() {
    this.props.fetchDeviceStatuses(false)
  }

  handleChange = (event, index, value) => {
    this.props.onDeviceStatusChange(index === 0 ? undefined : value)
  }

  render() {
    const { allItemText, deviceStatusItems, value } = this.props
    const restProps = _.omit(this.props, [
      'allItemText', 'fetchDeviceStatuses', 'deviceStatusItems', 'onDeviceStatusChange', 'value'
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
        {deviceStatusItems.map(c => (
          <MenuItem key={c.get('id')} value={c.get('id')} primaryText={c.get('name')} />
        ))}
      </SelectField>
    )
  }
}

function mapStateToProps(state) {
  return {
    deviceStatusItems: state.deviceStatus.items
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    fetchDeviceStatuses
  }, dispatch)
}

export default _.flowRight(
  connect(mapStateToProps, mapDispatchToProps)
)(DeviceStatusSelectField)
