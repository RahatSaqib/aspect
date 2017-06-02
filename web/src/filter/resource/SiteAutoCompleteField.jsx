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
import AutoComplete from 'material-ui/AutoComplete'

import { fetchSites } from '../../site/SiteRedux'

const filter = AutoComplete.caseInsensitiveFilter

const enhance = compose(
  pure,
  setPropTypes({
    onChangeSite: PropTypes.func.isRequired,
    itemTextGetter: PropTypes.func.isRequired,
    value: PropTypes.string,
  }),
  connect(
    state => ({
      siteItemsById: state.site.items.byId,
    }),
    bindActionCreators.bind(null, {
      fetchSites,
    })
  ),
  mapProps(props => ({
    ..._fp.omit(['siteItemsById', 'itemTextGetter'], props),
    siteList: props.siteItemsById
      .valueSeq()
      .map(item => ({
        value: item.get('name'),
        text: props.itemTextGetter(item),
      }))
      .toJS(),
  })),
  lifecycle({
    componentDidMount() {
      this.props.fetchSites({}, undefined, undefined, 0, 99999)
    },
  }),
  withHandlers({
    onSiteAutoCompleteNewRequest: props => (chosenRequest, index) => {
      if (index === -1) {
        // if user typed text and pressed Enter, then index=-1 - and
        // chosenRequest is string value
        // (see API doc - http://www.material-ui.com/#/components/auto-complete)
        props.onChangeSite(chosenRequest)
      } else {
        // if user selected item from the popup menu list then index>=0 and
        // chosenRequest is object literal of default format {text:'', value:''}
        props.onChangeSite(chosenRequest.value)
      }
    },
    // --------------------------
    // on bluring - check if actual visual site name is correct (exists in datasource)
    // and is equal to value stored in props
    // --------------------------
    onSiteAutoCompleteBlur: props => event => {
      const newValue = event.target.value.trim()
      props.onChangeSite(newValue)
    },
    onSiteAutoCompleteKeyUp: props => event => {
      if (event.key === 'Enter') {
        // --------------------------
        // FYI: NewRequest event is triggered only if input control has value (even spaces)
        // So,
        // - if control has no value and original value was not null/empty - then clear
        // - if control has value - do nothing because NewRequest is triggering next
        // --------------------------
        if (event.target.value.trim() === '') {
          props.onChangeSite(null)
        }
      }
    },
  }),
  mapProps(_fp.omit(['onChangeSite', 'fetchSites']))
)

/*
Event order
             | Mouse  |       |  Click   |
             | Select | ENTER | Outside  | onKeyPress (Enter/Esc)
====================================================
onBlur       |   1    |       |     1    |
----------------------------------------------------
onUpdateInput|   2    |       |          |     1
----------------------------------------------------
onClose      | 3 (x2) |   1   |     2    |           MenuClose
----------------------------------------------------
onNewRequest |   4    |   2   |          |
====================================================
             |   n    |   y   |     n    |     y    cursor-in
*/
export function SiteAutoCompleteField({
  value,
  siteList,
  onSiteAutoCompleteNewRequest,
  onSiteAutoCompleteBlur,
  onSiteAutoCompleteKeyUp,
  ...restProps
}) {
  const finalProps = Object.assign({}, restProps)
  delete finalProps.onChangeSiteId
  return (
    <AutoComplete
      {...finalProps}
      dataSource={siteList}
      filter={filter}
      searchText={value}
      onNewRequest={onSiteAutoCompleteNewRequest}
      onBlur={onSiteAutoCompleteBlur}
      onKeyUp={onSiteAutoCompleteKeyUp}
      listStyle={{ width: 'auto' }}
    />
  )
}

export default enhance(SiteAutoCompleteField)
