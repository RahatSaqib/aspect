// Imports from packages
import _ from 'lodash'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

// Material-UI
import MenuItem from '@material-ui/core/MenuItem'

import SelectField from '../../components/shared/SelectField'
import { fetchDeviceTypesForSelectList as fetchDeviceTypes } from '../../deviceType/DeviceTypeRedux'

export class MaintenanceStatusSelectField extends PureComponent {
  static propTypes = {
    fetchDeviceTypes: PropTypes.func.isRequired,
    maintenanceStatusItems: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
      })
    ).isRequired,
    onMaintenanceStatusIdChange: PropTypes.func.isRequired,
    value: PropTypes.string,
  }

  static defaultProps = {
    value: '',
  }

  componentDidMount() {
    this.props.fetchDeviceTypes(false)
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
    deviceTypeItems: state.deviceType.selectList.items,
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      fetchDeviceTypes,
    },
    dispatch
  )
}

export default _.flowRight(connect(mapStateToProps, mapDispatchToProps))(
  MaintenanceStatusSelectField
)
