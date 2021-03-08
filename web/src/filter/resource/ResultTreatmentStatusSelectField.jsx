// Imports from packages
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
import { defineMessages } from 'react-intl'
// Material-UI
import MenuItem from '@material-ui/core/MenuItem'
import SelectField from '../../components/shared/SelectField'

import { fetchTreatmentStatuses } from '../../resultTreatmentStatus/ResultTreatmentStatusRedux'

const messages = defineMessages({
  ResultTreatmentStatusAwaitingTreatment: {
    id:
      'pages.ResultTreatmentStatusFilter.ResultTreatmentStatusAwaitingTreatment',
    defaultMessage: 'Awaiting Treatment',
  },
  ResultTreatmentStatusOnTreatment: {
    id: 'pages.ResultTreatmentStatusFilter.ResultTreatmentStatusOnTreatment',
    defaultMessage: 'On Treatment',
  },
  ResultTreatmentStatusNotPossible: {
    id: 'pages.ResultTreatmentStatusFilter.ResultTreatmentStatusNotPossible',
    defaultMessage: 'Not Possible',
  },
})
const enhance = compose(
  pure,
  setPropTypes({
    fetchTreatmentStatuses: PropTypes.func.isRequired,
    value: PropTypes.string,
  }),
  connect(
    state => ({
      resultTreatmentStatusList: state.resultTreatmentStatus,
    }),
    dispatch =>
      bindActionCreators(
        {
          fetchTreatmentStatuses,
        },
        dispatch
      )
  ),
  lifecycle({
    componentDidMount() {
      this.props.fetchTreatmentStatuses()
    },
  }),
  withHandlers({
    onChange: props => ({ target: { value } }) => {
      props.onTreatmentStatusChange(value === 'all' ? undefined : value)
    },
  }),
  mapProps(props => {
    return {
      ...props,
      treatmentSelectList: props.resultTreatmentStatusList.items
        .map(item => ({
          value: item.get('id'),
          text: item.get('name'),
          i18nKey: item.get('i18nKey'),
        }))
        .toJS(),
    }
  })
)

export function TreatmentSelectField({
  treatmentSelectList,
  allItemText,
  intl,
  ...restProps
}) {
  const textForItem = item =>
    messages[item.i18nKey]
      ? intl.formatMessage(messages[item.i18nKey])
      : item.i18nKey

  return (
    <SelectField {...restProps} value={restProps.value}>
      {allItemText && <MenuItem value="all">{allItemText}</MenuItem>}
      {treatmentSelectList.map(s => (
        <MenuItem key={s.value} value={s.value}>
          {textForItem(s)}
        </MenuItem>
      ))}
    </SelectField>
  )
}

export default enhance(TreatmentSelectField)
