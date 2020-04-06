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
  diseaseNameTuberculosis: {
    id: 'filter.AssayTypeSelectField.diseaseNameTuberculosis',
    defaultMessage: 'Tuberculosis',
  },
  diseaseNameEbola: {
    id: 'filter.AssayTypeSelectField.diseaseNameEbola',
    defaultMessage: 'Ebola',
  },
  diseaseNameHIVAIDS: {
    id: 'filter.AssayTypeSelectField.diseaseNameHIVAIDS',
    defaultMessage: 'HIV/AIDS',
  },
  diseaseNameHepatitisB: {
    id: 'filter.AssayTypeSelectField.diseaseNameHepatitisB',
    defaultMessage: 'Hepatitis B',
  },
  diseaseNameHepatitisC: {
    id: 'filter.AssayTypeSelectField.diseaseNameHepatitisC',
    defaultMessage: 'Hepatitis C',
  },
  diseaseNameZikaFever: {
    id: 'filter.AssayTypeSelectField.diseaseNameZikaFever',
    defaultMessage: 'Zika Fever',
  },
  diseaseNameDengueFever: {
    id: 'filter.AssayTypeSelectField.diseaseNameDengueFever',
    defaultMessage: 'Dengue Fever',
  },
  diseaseNameCovid19: {
    id: 'filter.AssayTypeSelectField.diseaseNameCovid19',
    defaultMessage: 'SARS-CoV-2 (COVID-19)',
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
