import _fp from 'lodash/fp'
import React, { PropTypes } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { compose, pure, setPropTypes, mapProps, lifecycle } from 'recompose'

import MenuItem from 'material-ui/MenuItem'

import { fetchPartnersAndRolesForSelectList } from '../../role/RoleRedux'
import ForkedSelectField from '../../components/forkedMaterialUi/ForkedSelectField'

const enhance = compose(
  pure,
  setPropTypes({
    partnerId: PropTypes.string,
    emptyId: PropTypes.string.isRequired,
    emptyText: PropTypes.string.isRequired,
    onChangePartner: PropTypes.func.isRequired
  }),
  connect(state => ({
    partnersAndRolesForSelectList: state.roles.partnersAndRolesForSelectList
  }), dispatch => bindActionCreators({
    fetchPartnersAndRolesForSelectList
  }, dispatch)),
  lifecycle({
    componentDidMount() {
      this.props.fetchPartnersAndRolesForSelectList()
    }
  }),
  mapProps(props => ({
    ..._fp.omit([
      'emptyId',
      'emptyText',
      'partnersAndRolesForSelectList',
      'fetchPartnersAndRolesForSelectList'
    ], props),
    partnerList: props.partnersAndRolesForSelectList
      .partners
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
  })),
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
      {partnerList.map(p => (
        <MenuItem
          key={p.value}
          value={p.value}
          primaryText={p.text}
        />
      ))}
    </ForkedSelectField>
  )
}

export default enhance(PartnerSelectField)
