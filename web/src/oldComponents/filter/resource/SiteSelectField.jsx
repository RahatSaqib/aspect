import React from 'react'
import MenuItem from '@mui/material/MenuItem'
import _fp from 'lodash/fp'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { compose, pure, setPropTypes, mapProps, lifecycle, withHandlers } from 'recompose'
import { bindActionCreators } from 'redux'
import { fetchSitesForSelectList } from '../../../store/SiteRedux'
import SelectField from '../../shared/SelectField'

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
    onChange:
      props =>
      ({ target: { value } }) => {
        props.onSiteChange(value)
      },
  }),
  mapProps(props => ({
    ..._fp.omit(
      ['countryId', 'stateId', 'lgaId', 'partnerId', 'onSiteChange', 'fetchSitesForSelectList', 'siteSelectList'],
      props
    ),
    sitesSelectList: props.sitesSelectList.items
      .filter(item => {
        if (props.countryId && +props.countryId !== +item.get('countryId')) {
          return false
        }
        if (props.partnerId && +props.partnerId !== +item.get('partnerId')) {
          return false
        }
        if (props.stateId && +props.stateId !== +item.get('stateId')) {
          return false
        }
        if (props.lgaId && +props.lgaId !== +item.get('lgaId')) {
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

export function SiteSelectField({ sitesSelectList, onChange, allItemText, ...restProps }) {
  return (
    <SelectField {...restProps} onChange={onChange}>
      {allItemText && <MenuItem value={undefined}>{allItemText}</MenuItem>}
      {sitesSelectList.map(s => (
        <MenuItem key={s.value} value={s.value}>
          {s.text}
        </MenuItem>
      ))}
    </SelectField>
  )
}

export default enhance(SiteSelectField)
