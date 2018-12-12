// Imports from packages
import _fp from 'lodash/fp'
import PropTypes from 'prop-types'
import React from 'react'
import {
  compose,
  pure,
  setPropTypes,
  mapProps,
  lifecycle,
  withHandlers,
} from 'recompose'
import { connect } from 'react-redux'

// Material-UI
import MenuItem from '@material-ui/core/MenuItem'
import Select from '@material-ui/core/Select'

import { fetchDevicesForSelectList } from '../../device/DeviceRedux'

const enhance = compose(
  pure,
  setPropTypes({
    countryId: PropTypes.string,
    partnerId: PropTypes.string,
    siteId: PropTypes.string,
    onDeviceChange: PropTypes.func.isRequired,
    value: PropTypes.string,
  }),
  connect(
    state => ({
      devicesSelectList: state.device.selectList,
    }),
    (dispatch, props) => ({
      fetchDevicesWithFiltersForSelectList() {
        dispatch(
          fetchDevicesForSelectList(true, {
            countryId: props.countryId,
            partnerId: props.partnerId,
            siteId: props.siteId,
          })
        )
      },
    })
  ),
  lifecycle({
    componentDidMount() {
      this.props.fetchDevicesWithFiltersForSelectList()
    },
    componentDidUpdate(prevProps) {
      const filtersChanged = _fp.any(
        name => this.props[name] !== prevProps[name],
        ['countryId', 'partnerId', 'siteId']
      )
      if (filtersChanged) {
        this.props.fetchDevicesWithFiltersForSelectList()
      }
    },
  }),
  withHandlers({
    onChange: props => (event, index, value) => {
      props.onDeviceChange(value)
    },
  }),
  mapProps(props => ({
    ..._fp.omit(
      [
        'countryId',
        'partnerId',
        'siteId',
        'onDeviceChange',
        'fetchDevicesWithFiltersForSelectList',
        'devicesSelectList',
      ],
      props
    ),
    devicesSelectList: props.devicesSelectList.items
      .map(item => ({
        value: item.get('id'),
        text: item.get('name'),
      }))
      .toJS(),
  }))
)

export function DeviceSelectField({ devicesSelectList, ...restProps }) {
  return (
    <Select {...restProps}>
      {devicesSelectList.map(s => (
        <MenuItem key={s.value} value={s.value} primaryText={s.text} />
      ))}
    </Select>
  )
}

export default enhance(DeviceSelectField)
