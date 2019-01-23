// Imports from packages
import _ from 'lodash'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

// Material-UI
import MenuItem from '@material-ui/core/MenuItem'

import SelectField from '../../components/shared/SelectField'
import { fetchDeviceStatuses } from '../../deviceStatus/DeviceStatusRedux'

export class DeviceStatusSelectField extends PureComponent {
  static propTypes = {
    allItemText: PropTypes.string,
    fetchDeviceStatuses: PropTypes.func.isRequired,
    deviceStatusItems: PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
    }).isRequired,
    onDeviceStatusChange: PropTypes.func.isRequired,
    value: PropTypes.string,
  }

  static defaultProps = {
    allItemText: 'All',
    value: '',
  }

  componentDidMount() {
    this.props.fetchDeviceStatuses(false)
  }

  handleChange = ({ target: { value } }) => {
    this.props.onDeviceStatusChange(value === 'all' ? undefined : value)
  }

  render() {
    const { allItemText, deviceStatusItems, value } = this.props
    const restProps = _.omit(this.props, [
      'allItemText',
      'fetchDeviceStatuses',
      'deviceStatusItems',
      'onDeviceStatusChange',
      'value',
    ])

    return (
      <SelectField {...restProps} value={value} onChange={this.handleChange}>
        {allItemText && <MenuItem value="all">{allItemText}</MenuItem>}
        {deviceStatusItems.map(a => (
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
    deviceStatusItems: state.deviceStatus.items,
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      fetchDeviceStatuses,
    },
    dispatch
  )
}

export default _.flowRight(connect(mapStateToProps, mapDispatchToProps))(
  DeviceStatusSelectField
)
