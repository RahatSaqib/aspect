import _fp from 'lodash/fp'
import PropTypes from 'prop-types'
import {
  compose,
  pure,
  withProps,
  setPropTypes,
  mapProps,
  lifecycle,
  withHandlers,
} from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

// Material-UI
import AutoComplete from 'material-ui/AutoComplete'

import { fetchSitesForSelectList } from '../../site/SiteRedux'

const filter = AutoComplete.caseInsensitiveFilter

const enhance = compose(
  pure,
  setPropTypes({
    onSiteIdChange: PropTypes.func,
    onSiteNameChange: PropTypes.func,
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
  withProps(props => ({
    onSiteIdChange: props.onSiteIdChange || _fp.noop,
    onSiteNameChange: props.onSiteNameChange || _fp.noop,
  })),
  withHandlers({
    onNewRequest: ({ onSiteIdChange, onSiteNameChange }) => (
      chosenRequest,
      index
    ) => {
      const text =
        index === -1
          ? /* if user typed text and pressed Enter, then index=-1 - and
         * chosenRequest is string value
         * (see API doc - http://www.material-ui.com/#/components/auto-complete)
         */
            chosenRequest
          : /* if user selected item from the popup menu list then index>=0 and
         * chosenRequest is object literal of default format {text:'', value:''}
         */
            chosenRequest.text
      onSiteNameChange(text)
      if (index !== -1) {
        onSiteIdChange(chosenRequest.value)
      }
    },
    // --------------------------
    // on bluring - check if actual visual site name is correct (exists in dataSource)
    // and is equal to value stored in props
    // --------------------------
    onBlur: ({ onSiteNameChange }) => ({ target: { value } }) => {
      onSiteNameChange(value.trim())
    },
    onKeyUp: ({ onSiteNameChange }) => ({ key, target: { value } }) => {
      if (key === 'Enter') {
        // --------------------------
        // FYI: NewRequest event is triggered only if input control has value (even spaces)
        // So,
        // - if control has no value and original value was not null/empty - then clear
        // - if control has value - do nothing because NewRequest is triggering next
        // --------------------------
        if (value.trim() === '') {
          onSiteNameChange(null)
        }
      }
    },
  }),
  mapProps(props => {
    const dataSource = props.sitesSelectList.items.map(item => ({
      value: item.get('id'),
      text: item.get('name'),
    }))
    const searchText = dataSource.find(
      ({ value }) => value === props.value,
      null,
      {
        text: props.value,
      }
    ).text

    return {
      ..._fp.omit(
        [
          'onSiteIdChange',
          'onSiteNameChange',
          'fetchSitesForSelectList',
          'sitesSelectList',
        ],
        props
      ),
      filter,
      searchText,
      dataSource: dataSource.toJS(),
      listStyle: { width: 'auto' },
    }
  })
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
export const SiteAutoCompleteField = AutoComplete

export default enhance(SiteAutoCompleteField)
