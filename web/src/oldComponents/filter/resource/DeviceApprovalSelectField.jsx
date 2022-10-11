import React, { PureComponent } from 'react'
import { MenuItem } from '@mui/material'
import Immutable from 'immutable'
import flowRight from 'lodash/flowRight'
import omit from 'lodash/omit'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { deviceApprovalMessages } from '../../../messages'
import { I18nContext } from '../../../providers/I18nProvider'
import { fetchDeviceApprovals } from '../../../store/DeviceApprovalRedux'
import formatI18nMessage from '../../../utils/i18n/formatterWeb'
import SelectField from '../../shared/SelectField'

export class DeviceApprovalSelectField extends PureComponent {
  static propTypes = {
    allItemText: PropTypes.string,
    fetchDeviceApprovals: PropTypes.func.isRequired,
    deviceApprovalItems: PropTypes.instanceOf(Immutable.List).isRequired,
    onDeviceApprovalChange: PropTypes.func.isRequired,
    value: PropTypes.string,
  }

  static defaultProps = {
    allItemText: 'All',
    value: '',
  }

  static contextType = I18nContext

  componentDidMount() {
    this.props.fetchDeviceApprovals(false)
  }

  handleChange = ({ target: { value } }) => {
    this.props.onDeviceApprovalChange(value === 'all' ? undefined : value)
  }

  render() {
    const { allItemText, deviceApprovalItems, value } = this.props
    const restProps = omit(this.props, [
      'allItemText',
      'fetchDeviceApprovals',
      'deviceApprovalItems',
      'onDeviceApprovalChange',
      'value',
    ])
    const { formatMessage } = this.context

    return (
      <SelectField {...restProps} value={value} onChange={this.handleChange}>
        {allItemText && <MenuItem value="all">{allItemText}</MenuItem>}
        {deviceApprovalItems.map(a => (
          <MenuItem key={a.get('id')} value={a.get('id')}>
            {formatI18nMessage(deviceApprovalMessages, formatMessage, a.get('i18nKey'), a.get('name'))}
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

export default flowRight(connect(mapStateToProps, mapDispatchToProps))(DeviceApprovalSelectField)
