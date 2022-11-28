import React from 'react'
import { MenuItem } from '@mui/material'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { compose, setPropTypes, lifecycle, pure } from 'recompose'
import { bindActionCreators } from 'redux'
import useI18n from '../../../hooks/useI18n'
import messages from '../../../messages/diseaseMessages'
import { fetchDiseases } from '../../../store/DiseaseRedux'
import formatI18nMessage from '../../../utils/i18n/formatterWeb'
import SelectField from '../../shared/SelectField'

const enhance = compose(
  pure,
  setPropTypes({
    allItemText: PropTypes.string,
    onDiseaseIdChange: PropTypes.func,
    value: PropTypes.string,
  }),
  connect(
    state => ({
      diseases: state.disease.diseases,
    }),
    bindActionCreators.bind(null, {
      fetchDiseases,
    })
  ),
  lifecycle({
    UNSAFE_componentWillMount() {
      this.setState({
        onChange: ({ target: { value } }) => {
          this.props.onDiseaseIdChange(value === 'all' ? undefined : value)
        },
      })
    },

    componentDidMount() {
      this.props.fetchDiseases()
    },
  })
)

export const DiseaseSelectField = ({
  allItemText,
  onlyWithResults,
  diseases,
  onChange,
  // to remove from restProps
  onDiseaseIdChange,
  fetchDiseases,
  ...restProps
}) => {
  const validDisease = onlyWithResults ? diseases.items.filter(a => a.get('hasResults')) : diseases.items
  const { formatMessage } = useI18n()
  return (
    <SelectField
      {...restProps}
      onChange={onChange}
      disabled={restProps.disabled || diseases.loading || validDisease.isEmpty() || validDisease.size <= 1}
    >
      {allItemText && <MenuItem value="all">{allItemText}</MenuItem>}
      {validDisease.map(d => (
        <MenuItem key={d.get('id')} value={d.get('id')}>
          {formatI18nMessage(messages, formatMessage, d.get('i18nKey'), d.get('name'))}
        </MenuItem>
      ))}
    </SelectField>
  )
}

export default enhance(DiseaseSelectField)
