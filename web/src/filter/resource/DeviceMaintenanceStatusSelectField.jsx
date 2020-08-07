// Imports from packages
import _ from 'lodash'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { defineMessages } from 'react-intl'

// Material-UI
import MenuItem from '@material-ui/core/MenuItem'

import SelectField from '../../components/shared/SelectField'
import { fetchDeviceMaintenanceStatus as fetchStatuses } from '../../device/maintenance/DeviceMaintenanceStatusRedux'

const messages = defineMessages({
  active: {
    id: 'pages.DeviceMaintenanceStatusSelectField.maintenanceStatus.active',
    defaultMessage: 'Active',
  },
  inactiveConnectivity: {
    id:
      'pages.DeviceMaintenanceStatusSelectField.maintenanceStatus.inactiveConnectivity',
    defaultMessage: 'Connectivity',
  },
  inactiveDecommissioned: {
    id:
      'pages.DeviceMaintenanceStatusSelectField.maintenanceStatus.inactiveDecommissioned',
    defaultMessage: 'Decommissioned',
  },
  inactiveDownForRepair: {
    id:
      'pages.DeviceMaintenanceStatusSelectField.maintenanceStatus.inactiveDownForRepair',
    defaultMessage: 'Down For Repair',
  },
  inactiveNoResultsReported: {
    id:
      'pages.DeviceMaintenanceStatusSelectField.maintenanceStatus.inactiveNoResultsReported',
    defaultMessage: 'No Results Reported',
  },
  inactiveOutOfInventory: {
    id:
      'pages.DeviceMaintenanceStatusSelectField.maintenanceStatus.inactiveOutOfInventory',
    defaultMessage: 'Out Of Inventory',
  },
  inactiveUnknown: {
    id:
      'pages.DeviceMaintenanceStatusSelectField.maintenanceStatus.inactiveUnknown',
    defaultMessage: 'Unknown',
  },
  reportedActive: {
    id:
      'pages.DeviceMaintenanceStatusSelectField.maintenanceStatus.reportedActive',
    defaultMessage: 'Active',
  },
})
export class DeviceMaintenanceStatusSelectField extends PureComponent {
  static propTypes = {
    // eslint-disable-next-line react/forbid-prop-types
    intl: PropTypes.object.isRequired,
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
    this.props.fetchStatuses(true)
  }

  handleChange = ({ target: { value } }) => {
    this.props.onMaintenanceStatusChange(value)
  }

  render() {
    const { maintenanceStatusItems, value, intl } = this.props
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
              {intl.formatMessage(messages[a.get('i18nKey')])}
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
