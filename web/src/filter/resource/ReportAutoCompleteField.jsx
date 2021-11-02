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
import { connect } from 'react-redux'

import AutoComplete from '../../components/shared/AutoComplete'
import { fetchReportsForSelectList } from '../../report/ReportRedux'

const filter = AutoComplete.caseInsensitiveFilter

const enhance = compose(
  pure,
  setPropTypes({
    onReportExternalIdChange: PropTypes.func,
    onReportNameChange: PropTypes.func,
    value: PropTypes.string,
  }),
  connect(
    state => ({
      reportsSelectList: state.report,
    }),
    {
      fetchReportsForSelectList,
    }
  ),
  lifecycle({
    componentDidMount() {
      this.props.fetchReportsForSelectList()
    },
  }),
  withProps(props => ({
    onReportExternalIdChange: props.onReportExternalIdChange || _fp.noop,
    onReportNameChange: props.onReportNameChange || _fp.noop,
  })),
  withHandlers({
    onSelect:
      ({ onReportExternalIdChange, onReportNameChange }) =>
      chosenRequest => {
        if (chosenRequest) {
          onReportNameChange(chosenRequest.text)
          onReportExternalIdChange(chosenRequest.value)
        }
      },
    onUpdateInput:
      ({ onReportNameChange }) =>
      text => {
        onReportNameChange(text)
      },
  }),
  mapProps(props => {
    const dataSource = props.reportsSelectList.selectList.items.map(item => ({
      value: item.get('externalId'),
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
          'onReportExternalIdChange',
          'onReportNameChange',
          'fetchReportsForSelectList',
          'reportsSelectList',
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
export const ReportAutoCompleteField = AutoComplete

export default enhance(ReportAutoCompleteField)
