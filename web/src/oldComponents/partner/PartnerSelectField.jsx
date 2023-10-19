import React from 'react'
import { MenuItem } from '@mui/material'
import _fp from 'lodash/fp'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { compose, pure, setPropTypes, mapProps, lifecycle } from 'recompose'
import { bindActionCreators } from 'redux'
import { fetchPartnersAndJobFunctionsForSelectList } from '../../store/JobRedux'
import SelectField from '../shared/SelectField'

const enhance = compose(
  pure,
  setPropTypes({
    partnerId: PropTypes.string,
    emptyId: PropTypes.string.isRequired,
    emptyText: PropTypes.string.isRequired,
    onChangePartner: PropTypes.func.isRequired,
  }),
  connect(
    state => ({
      partnersAndJobFunctionsForSelectList: state.jobs.partnersAndJobFunctionsForSelectList,
    }),
    dispatch =>
      bindActionCreators(
        {
          fetchPartnersAndJobFunctionsForSelectList,
        },
        dispatch
      )
  ),
  lifecycle({
    componentDidMount() {
      this.props.fetchPartnersAndJobFunctionsForSelectList()
    },
  }),
  mapProps(props => ({
    ..._fp.omit(
      ['emptyId', 'emptyText', 'partnersAndJobFunctionsForSelectList', 'fetchPartnersAndJobFunctionsForSelectList'],
      props
    ),
    partnerList: props.partnersAndJobFunctionsForSelectList.partners
      // Filter out empty items if props.emptyText is an empty string
      .filter(item => (props.emptyText ? true : item.get('id')))
      .map(item => ({
        value: item.get('id') || props.emptyId,
        text: item.get('name') || props.emptyText,
      }))
      .toJS(),
    onChangePartner({ target: { value } }) {
      props.onChangePartner(value)
    },
  }))
)

function PartnerSelectField({ onChangePartner, partnerId, partnerList, disabled, ...restProps }) {
  return (
    <SelectField
      {...restProps}
      value={partnerId}
      onChange={onChangePartner}
      disabled={disabled || _fp.isEmpty(partnerList)}
    >
      {partnerList.map(p => (
        <MenuItem key={p.value} value={p.value}>
          {p.text}
        </MenuItem>
      ))}
    </SelectField>
  )
}

export default enhance(PartnerSelectField)
