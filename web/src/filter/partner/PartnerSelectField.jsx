import _fp from 'lodash/fp'
import PropTypes from 'prop-types'
import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { compose, pure, setPropTypes, mapProps, lifecycle } from 'recompose'

import MenuItem from 'material-ui/MenuItem'

import { fetchPartnersAndJobFunctionsForSelectList } from '../../job/JobRedux'
import ForkedSelectField from '../../components/forkedMaterialUi/ForkedSelectField'

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
    onChangePartner(event, index, value) {
      props.onChangePartner(value)
    },
  }))
)

export function PartnerSelectField({
  onChangePartner,
  partnerId,
  partnerList,
  ...restProps
}) {
  return (
    <ForkedSelectField
      {...restProps}
      value={partnerId}
      onChange={onChangePartner}
    >
      {partnerList.map(p =>
        <MenuItem key={p.value} value={p.value} primaryText={p.text} />
      )}
    </ForkedSelectField>
  )
}

export default enhance(PartnerSelectField)
