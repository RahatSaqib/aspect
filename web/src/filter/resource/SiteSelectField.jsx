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
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

// Material-UI
import MenuItem from '@material-ui/core/MenuItem'

import SelectField from '../../components/shared/SelectField'
import { fetchSitesForSelectList } from '../../site/SiteRedux'

const enhance = compose(
  pure,
  setPropTypes({
    countryId: PropTypes.string,
    partnerId: PropTypes.string,
    onSiteChange: PropTypes.func.isRequired,
    value: PropTypes.string,
  }),
  connect(
    state => ({
      sitesSelectList: state.site.selectList,
    }),
    bindActionCreators.bind(null, {
      fetchSitesForSelectList,
    })
  ),
  lifecycle({
    componentDidMount() {
      this.props.fetchSitesForSelectList()
    },
  }),
  withHandlers({
    onChange: props => ({ target: { value } }) => {
      props.onSiteChange(value)
    },
  }),
  mapProps(props => ({
    ..._fp.omit(
      [
        'countryId',
        'partnerId',
        'onSiteChange',
        'fetchSitesForSelectList',
        'siteSelectList',
      ],
      props
    ),
    sitesSelectList: props.sitesSelectList.items
      .filter(item => {
        if (props.countryId && props.countryId !== item.get('countryId')) {
          return false
        }
        if (props.partnerId && props.partnerId !== item.get('partnerId')) {
          return false
        }
        return true
      })
      .map(item => ({
        value: item.get('id'),
        text: item.get('name'),
      }))
      .toJS(),
  }))
)

export function SiteSelectField({ sitesSelectList, ...restProps }) {
  return (
    <SelectField {...restProps}>
      {sitesSelectList.map(s => (
        <MenuItem key={s.value} value={s.value}>
          {s.text}
        </MenuItem>
      ))}
    </SelectField>
  )
}

export default enhance(SiteSelectField)
