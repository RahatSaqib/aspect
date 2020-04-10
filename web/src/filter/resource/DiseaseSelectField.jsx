import PropTypes from 'prop-types'
import { defineMessages } from 'react-intl'
import React from 'react'
import { compose, setPropTypes, lifecycle, pure } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import MenuItem from '@material-ui/core/MenuItem'

import SelectField from '../../components/shared/SelectField'
import { fetchDiseases } from '../../disease/DiseaseRedux'

const messages = defineMessages({
  diseaseNameDengueFever: {
    id: 'filter.DiseaseSelectField.diseaseNameDengueFever',
    defaultMessage: 'Dengue Fever',
  },
  diseaseNameEbola: {
    id: 'filter.DiseaseSelectField.diseaseNameEbola',
    defaultMessage: 'Ebola',
  },
  diseaseNameHepatitisB: {
    id: 'filter.DiseaseSelectField.diseaseNameHepatitisB',
    defaultMessage: 'Hepatitis B',
  },
  diseaseNameHepatitisC: {
    id: 'filter.DiseaseSelectField.diseaseNameHepatitisC',
    defaultMessage: 'Hepatitis C',
  },
  diseaseNameHIVAIDS: {
    id: 'filter.DiseaseSelectField.diseaseNameHIVAIDS',
    defaultMessage: 'HIV/AIDS',
  },
  diseaseNameCovid19: {
    id: 'filter.DiseaseSelectField.diseaseNameCovid19',
    defaultMessage: 'SARS-CoV-2 (COVID-19)',
  },
  diseaseNameTuberculosis: {
    id: 'filter.DiseaseSelectField.diseaseNameTuberculosis',
    defaultMessage: 'Tuberculosis',
  },
  diseaseNameZikaFever: {
    id: 'filter.DiseaseSelectField.diseaseNameZikaFever',
    defaultMessage: 'Zika Fever',
  },
})

const enhance = compose(
  pure,
  setPropTypes({
    allItemText: PropTypes.string,
    intl: PropTypes.object.isRequired,
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
    componentWillMount() {
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
  intl,
  fetchDiseases,
  diseases,
  onChange,
  ...restProps
}) => (
  <SelectField
    {...restProps}
    onChange={onChange}
    disabled={
      restProps.disabled || diseases.loading || diseases.items.isEmpty()
    }
  >
    {allItemText && <MenuItem value="all">{allItemText}</MenuItem>}
    {diseases.items.map(d => (
      <MenuItem key={d.get('id')} value={d.get('id')}>
        {messages[d.get('i18nKey')]
          ? intl.formatMessage(messages[d.get('i18nKey')])
          : d.get('name')}
      </MenuItem>
    ))}
  </SelectField>
)

export default enhance(DiseaseSelectField)
