// Imports from packages
import _ from 'lodash'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

// Material-UI
import MenuItem from '@material-ui/core/MenuItem'

import SelectField from '../../components/shared/SelectField'
import { fetchDeviceMaintenanceStatus as fetchStatuses } from '../../device/maintenance/DeviceMaintenanceStatusRedux'

export class DeviceMaintenanceStatusSelectField extends PureComponent {
  static propTypes = {
    fetchStatuses: PropTypes.func.isRequired,
    maintenanceStatusItems: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
      })
    ).isRequired,
    allItemText: PropTypes.string,

    onMaintenanceStatusIdChange: PropTypes.func.isRequired,
    value: PropTypes.string,
  }

  static defaultProps = {
    value: '',
    allItemText: 'N/A',
  }

  componentDidMount() {
    this.props.fetchStatuses(false)
  }

  handleChange = ({ target: { value } }) => {
    this.props.onMaintenanceStatusIdChange(value)
  }

  render() {
    const { maintenanceStatusItems, value } = this.props
    const restProps = _.omit(this.props, [
      'fetchDeviceTypes',
      'deviceTypeItems',
      'onMaintenanceStatusIdChange',
      'value',
    ])
    return (
      <SelectField {...restProps} value={value} onChange={this.handleChange}>
        <MenuItem value={null}>{this.props.allItemText}</MenuItem>

        {maintenanceStatusItems.map(a => (
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
    maintenanceStatusItems: state.deviceMaintenanceStatus.items,
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      fetchStatuses,
    },
    dispatch
  )
}

export default _.flowRight(connect(mapStateToProps, mapDispatchToProps))(
  DeviceMaintenanceStatusSelectField
)
