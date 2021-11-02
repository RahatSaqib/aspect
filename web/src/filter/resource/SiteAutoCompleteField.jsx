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

import AutoComplete from '../../components/shared/AutoComplete'

import { fetchSitesForSelectList } from '../../site/SiteRedux'

const filter = AutoComplete.caseInsensitiveFilter

const enhance = compose(
  pure,
  setPropTypes({
    onChange: PropTypes.func,
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
    onChange: props.onChange,
    onSiteIdChange: props.onSiteIdChange || _fp.noop,
    onSiteNameChange: props.onSiteNameChange || _fp.noop,
  })),
  withHandlers({
    onSelect:
      ({ onChange, onSiteIdChange, onSiteNameChange }) =>
      chosenRequest => {
        if (chosenRequest) {
          if (onChange) {
            onChange({
              id: chosenRequest.value,
              name: chosenRequest.text,
            })
            return
          }

          onSiteNameChange(chosenRequest.text)
          onSiteIdChange(chosenRequest.value)
        }
      },
    onUpdateInput:
      ({ onChange, onSiteNameChange }) =>
      text => {
        if (onChange) {
          onChange({ name: text })
          return
        }

        onSiteNameChange(text)
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
          'onChange',
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
