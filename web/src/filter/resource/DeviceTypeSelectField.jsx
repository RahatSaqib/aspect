import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import omit from 'lodash/omit'
import flowRight from 'lodash/flowRight'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { defineMessages } from 'react-intl'
import MenuItem from '@mui/material/MenuItem'
import Immutable from 'immutable'

import SelectField from '../../components/shared/SelectField'
import { fetchDeviceTypesForSelectList as fetchDeviceTypes } from '../../deviceType/DeviceTypeRedux'
import formatI18nMessage from '../../shared/i18n/formatterWeb'
import { I18nContext } from '../../Providers/I18nProvider'

const messages = defineMessages({})
export class DeviceTypeSelectField extends PureComponent {
  static propTypes = {
    allItemText: PropTypes.string,
    fetchDeviceTypes: PropTypes.func.isRequired,
    deviceTypeItems: PropTypes.instanceOf(Immutable.List).isRequired,
    onDeviceTypeChange: PropTypes.func.isRequired,
    value: PropTypes.string,
  }

  static defaultProps = {
    allItemText: 'All',
    value: '',
  }

  static contextType = I18nContext

  componentDidMount() {
    this.props.fetchDeviceTypes(false)
  }

  handleChange = ({ target: { value } }) => {
    this.props.onDeviceTypeChange(value === 'all' ? undefined : value)
  }

  render() {
    const { allItemText, deviceTypeItems, value } = this.props
    const restProps = omit(this.props, [
      'allItemText',
      'fetchDeviceTypes',
      'deviceTypeItems',
      'onDeviceTypeChange',
      'value',
    ])
    const { formatMessage } = this.context
    return (
      <SelectField {...restProps} value={value} onChange={this.handleChange}>
        {allItemText && <MenuItem value="all">{allItemText}</MenuItem>}
        {deviceTypeItems.map(a => (
          <MenuItem key={a.get('externalId')} value={a.get('externalId')}>
            {formatI18nMessage(messages, formatMessage, a.get('i18nKey'), a.get('name'))}
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

export default flowRight(connect(mapStateToProps, mapDispatchToProps))(DeviceTypeSelectField)
