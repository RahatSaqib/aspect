import React from 'react'
import PropTypes from 'prop-types'
import { compose, pure, setPropTypes, mapProps, lifecycle, withHandlers } from 'recompose'
import { connect } from 'react-redux'
import MenuItem from '@material-ui/core/MenuItem'
import useI18n from '../../Hooks/i18n/useI18n'

import SelectField from '../../components/shared/SelectField'
import messages from './i18n/resultTreatmentStatusMessages'
import { fetchTreatmentStatuses } from '../../resultTreatmentStatus/ResultTreatmentStatusRedux'
import formatI18nMessage from '../../shared/i18n/formatterWeb'

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
