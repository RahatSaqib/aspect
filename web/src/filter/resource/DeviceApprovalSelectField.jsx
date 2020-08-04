// Imports from packages
import _ from 'lodash'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

// Material-UI
import MenuItem from '@material-ui/core/MenuItem'

import SelectField from '../../components/shared/SelectField'
import { fetchDeviceApprovals } from '../../deviceApproval/DeviceApprovalRedux'

export class DeviceApprovalSelectField extends PureComponent {
  static propTypes = {
    allItemText: PropTypes.string,
    fetchDeviceApprovals: PropTypes.func.isRequired,
    deviceApprovalItems: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
      })
    ).isRequired,
    onDeviceApprovalChange: PropTypes.func.isRequired,
    value: PropTypes.string,
  }

  static defaultProps = {
    allItemText: 'All',
    value: '',
  }

  componentDidMount() {
    this.props.fetchDeviceApprovals(false)
  }

  handleChange = ({ target: { value } }) => {
    this.props.onDeviceApprovalChange(value === 'all' ? undefined : value)
  }

  render() {
    const { allItemText, deviceApprovalItems, value } = this.props
    const restProps = _.omit(this.props, [
      'allItemText',
      'fetchDeviceApprovals',
      'deviceApprovalItems',
      'onDeviceApprovalChange',
      'value',
    ])

    return (
      <SelectField {...restProps} value={value} onChange={this.handleChange}>
        {allItemText && <MenuItem value="all">{allItemText}</MenuItem>}
        {deviceApprovalItems.map(a => (
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
    deviceApprovalItems: state.deviceApproval.items,
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      fetchDeviceApprovals,
    },
    dispatch
  )
}

export default _.flowRight(connect(mapStateToProps, mapDispatchToProps))(
  DeviceApprovalSelectField
)
