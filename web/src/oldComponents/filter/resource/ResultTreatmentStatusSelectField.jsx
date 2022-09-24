import React from 'react'
import { MenuItem } from '@mui/material'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { compose, pure, setPropTypes, mapProps, lifecycle, withHandlers } from 'recompose'
import useI18n from '../../../hooks/useI18n'
import { fetchTreatmentStatuses } from '../../../store/ResultTreatmentStatusRedux'
import formatI18nMessage from '../../../utils/i18n/formatterWeb'
import SelectField from '../../shared/SelectField'
import messages from './i18n/resultTreatmentStatusMessages'

const enhance = compose(
  pure,
  connect(
    state => ({
      resultTreatmentStatusList: state.resultTreatmentStatus,
    }),
    {
      fetchTreatmentStatuses,
    }
  ),
  setPropTypes({
    fetchTreatmentStatuses: PropTypes.func.isRequired,
    onTreatmentStatusChange: PropTypes.func.isRequired,
    value: PropTypes.string,
  }),
  lifecycle({
    componentDidMount() {
      this.props.fetchTreatmentStatuses()
    },
  }),
  withHandlers({
    onChange:
      props =>
      ({ target: { value } }) => {
        props.onTreatmentStatusChange(value === 'all' ? undefined : value)
      },
  }),
  mapProps(props => {
    return {
      ...props,
      treatmentSelectList: props.resultTreatmentStatusList.items
        .map(item => ({
          value: item.get('externalId'),
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
  fetchTreatmentStatuses,
  onTreatmentStatusChange,
  resultTreatmentStatusList,
  ...restProps
}) {
  const { formatMessage } = useI18n()
  return (
    <SelectField {...restProps} value={restProps.value}>
      {allItemText && <MenuItem value="all">{allItemText}</MenuItem>}
      {treatmentSelectList.map(s => (
        <MenuItem key={s.value} value={s.value}>
          {formatI18nMessage(messages, formatMessage, s.i18nKey, s.name)}
        </MenuItem>
      ))}
    </SelectField>
  )
}

export default enhance(TreatmentSelectField)
