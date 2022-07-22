import React from 'react'
import PropTypes from 'prop-types'
import { compose, setPropTypes, lifecycle, pure } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import MenuItem from '@material-ui/core/MenuItem'

import messages from './i18n/diseaseMessages'
import SelectField from '../../components/shared/SelectField'
import { fetchDiseases } from '../../disease/DiseaseRedux'
import formatI18nMessage from '../../shared/i18n/formatterWeb'
import useI18n from '../../Hooks/i18n/useI18n'

const enhance = compose(
  pure,
  setPropTypes({
    allItemText: PropTypes.string,
    onDiseaseIdChange: PropTypes.func.isRequired,
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
