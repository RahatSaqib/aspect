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
    onMaintenanceStatusChange: PropTypes.func.isRequired,
    value: PropTypes.string,
  }

  static defaultProps = {
    value: '',
  }

  componentDidMount() {
    this.props.fetchStatuses(false)
  }

  handleChange = ({ target: { value } }) => {
    this.props.onMaintenanceStatusChange(value)
  }

  render() {
    const { maintenanceStatusItems, value } = this.props
    const restProps = _.omit(this.props, [
      'fetchDeviceTypes',
      'deviceTypeItems',
      'onMaintenanceStatusChange',
      'value',
    ])
    return (
      <SelectField {...restProps} value={value} onChange={this.handleChange}>
        {maintenanceStatusItems
          .filter(a => a.get('manuallySet'))
          .map(a => (
            <MenuItem key={a.get('externalId')} value={a.get('externalId')}>
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
