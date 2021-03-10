// Imports from packages
import omit from 'lodash/omit'
import flowRight from 'lodash/flowRight'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { defineMessages } from 'react-intl'
// Material-UI
import MenuItem from '@material-ui/core/MenuItem'

import SelectField from '../../components/shared/SelectField'
import { fetchDeviceTypesForSelectList as fetchDeviceTypes } from '../../deviceType/DeviceTypeRedux'

const messages = defineMessages({})
export class DeviceTypeSelectField extends PureComponent {
  static propTypes = {
    allItemText: PropTypes.string,
    fetchDeviceTypes: PropTypes.func.isRequired,
    deviceTypeItems: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        externalId: PropTypes.string,
        name: PropTypes.string,
      })
    ).isRequired,
    onDeviceTypeChange: PropTypes.func.isRequired,
    intl: PropTypes.oneOfType([PropTypes.object]).isRequired,
    value: PropTypes.string,
  }

  static defaultProps = {
    allItemText: 'All',
    value: '',
  }

  componentDidMount() {
    this.props.fetchDeviceTypes(false)
  }

  handleChange = ({ target: { value } }) => {
    this.props.onDeviceTypeChange(value === 'all' ? undefined : value)
  }

  render() {
    const { allItemText, deviceTypeItems, value, intl } = this.props
    const restProps = omit(this.props, [
      'allItemText',
      'fetchDeviceTypes',
      'deviceTypeItems',
      'onDeviceTypeChange',
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
        {deviceTypeItems.map(a => (
          <MenuItem key={a.get('externalId')} value={a.get('externalId')}>
            {textForItem(a)}
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

export default flowRight(connect(mapStateToProps, mapDispatchToProps))(
  DeviceTypeSelectField
)
