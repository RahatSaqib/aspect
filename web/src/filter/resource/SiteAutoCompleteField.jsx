// Imports from packages
import _fp from 'lodash/fp'
import React, { PropTypes } from 'react'
import { compose, pure, setPropTypes, mapProps, lifecycle, withHandlers } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

// Material-UI
import AutoComplete from 'material-ui/AutoComplete'

import { fetchSites } from '../../site/SiteRedux'

const enhance = compose(
  pure,
  setPropTypes({
    onChangeSiteId: PropTypes.func.isRequired,
    value: PropTypes.string
  }),
  connect(state => ({
    siteItemsById: state.site.items.byId
  }), bindActionCreators.bind(null, {
    fetchSites
  })),
  mapProps(props => ({
    ..._fp.omit(['siteItemsById'], props),
    siteList: props.siteItemsById
      .valueSeq()
      .map(item => ({
        value: item.get('id'),
        text: item.get('name')
      }))
      .toJS()
  })),
  lifecycle({
    componentDidMount() {
      this.props.fetchSites({}, undefined, undefined, 0, 99999)
    }
  }),
  withHandlers({
    onSiteAutoCompleteNewRequest: props => (chosenRequest, index) => {
      if (index === -1) {
        // if user typed text and pressed Enter, then index=-1 - and
        // chosenRequest is string value (see API doc - http://www.material-ui.com/#/components/auto-complete)
        const textLo = chosenRequest.toLowerCase().trim()
        const nextSite = _fp.find(s => s.text.toLowerCase() === textLo, props.siteList)
        if (nextSite) {
          props.onChangeSiteId(nextSite.value)
        }
      } else {
        // if user selected item from the list then index>=0 and
        // chosenRequest is object literal of default format {text:'', value:''}
        props.onChangeSiteId(chosenRequest.value)
      }
    },
    // --------------------------
    // on bluring - check if actual visual site name is correct (exists in datasource)
    // and is equal to value stored in props
    // --------------------------
    onSiteAutoCompleteBlur: props => (event) => {
      const textLo = event.target.value.toLowerCase().trim()
      const nextSite = _fp.find(s => s.text.toLowerCase() === textLo, props.siteList)

      if (nextSite) {
        // site with this name exists
        if (nextSite.value !== props.value) {
          // if visual site name differs from currently stored in props - change it
          props.onChangeSiteId(nextSite.value)
        }
      } else {
        // if no site found with this name - empty field
        props.onChangeSiteId(null)
      }
    }
  }),
  mapProps(_fp.omit(['onChangeSiteId', 'fetchSites']))
)

export function SiteAutoCompleteField({
  value,
  siteList,
  onSiteAutoCompleteNewRequest,
  onSiteAutoCompleteBlur,
  ...restProps
}) {
  const site = _fp.find(s => s.value === value, siteList)

  return (
    <AutoComplete
      {...restProps}
      dataSource={siteList}
      filter={AutoComplete.caseInsensitiveFilter}
      searchText={_fp.get('text', site)}
      onNewRequest={onSiteAutoCompleteNewRequest}
      onBlur={onSiteAutoCompleteBlur}
    />
  )
}

export default enhance(SiteAutoCompleteField)
