import _fp from 'lodash/fp'
import PropTypes from 'prop-types'
import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { compose, pure, setPropTypes, mapProps, lifecycle } from 'recompose'

import MenuItem from '@material-ui/core/MenuItem'

import SelectField from '../../components/shared/SelectField'
import { fetchPartnersAndJobFunctionsForSelectList } from '../../job/JobRedux'

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
      partnersAndJobFunctionsForSelectList:
        state.jobs.partnersAndJobFunctionsForSelectList,
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
      [
        'emptyId',
        'emptyText',
        'partnersAndJobFunctionsForSelectList',
        'fetchPartnersAndJobFunctionsForSelectList',
      ],
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

export function PartnerSelectField({
  onChangePartner,
  partnerId,
  partnerList,
  disabled,
  ...restProps
}) {
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
