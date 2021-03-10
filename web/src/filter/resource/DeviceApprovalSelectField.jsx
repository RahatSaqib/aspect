// Imports from packages
import omit from 'lodash/omit'
import flowRight from 'lodash/flowRight'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import MenuItem from '@material-ui/core/MenuItem'
import messages from './i18n/deviceApprovalMessages'
// Material-UI

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
    intl: PropTypes.oneOfType([PropTypes.object]).isRequired,
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
    const { allItemText, deviceApprovalItems, value, intl } = this.props
    const restProps = omit(this.props, [
      'allItemText',
      'fetchDeviceApprovals',
      'deviceApprovalItems',
      'onDeviceApprovalChange',
      'value',
    ])
    const textForItem = item => {
      return messages[item.get('i18nKey')]
        ? intl.formatMessage(messages[item.get('i18nKey')])
        : item.get('name')
    }
    return (
      <SelectField {...restProps} value={value} onChange={this.handleChange}>
        {allItemText && <MenuItem value="all">{allItemText}</MenuItem>}
        {deviceApprovalItems.map(a => (
          <MenuItem key={a.get('id')} value={a.get('id')}>
            {textForItem(a)}
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

export default flowRight(connect(mapStateToProps, mapDispatchToProps))(
  DeviceApprovalSelectField
)
