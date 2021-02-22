import React from 'react'
import { defineMessages } from 'react-intl'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import Grid from '@material-ui/core/Grid'
import PropTypeOf from '../../shared/types'

const cssClasses = classnames.bind(require('./Form.css'))

const messages = {
  ...defineMessages({
    site: {
      id: 'forms.formSectionHeader.site',
      defaultMessage: 'Site',
    },
    device: {
      id: 'forms.formSectionHeader.device',
      defaultMessage: 'Device',
    },
    assay: {
      id: 'forms.formSectionHeader.assay',
      defaultMessage: 'Assay',
    },
    result: {
      id: 'forms.formSectionHeader.result',
      defaultMessage: 'Result',
    },
    date: {
      id: 'forms.formSectionHeader.date',
      defaultMessage: 'Date',
    },
    sample: {
      id: 'forms.formSectionHeader.sample',
      defaultMessage: 'Sample',
    },
    patient: {
      id: 'forms.formSectionHeader.patient',
      defaultMessage: 'Patient',
    },
    technicalDetails: {
      id: 'forms.formSectionHeader.technicalDetails',
      defaultMessage: 'Technical Details',
    },
  }),
}

const FormSectionHeader = ({ intl, header, headerI18nKey }) => (
  <Grid item xs={2} className={cssClasses('form__sectionHeader')}>
    {headerI18nKey ? intl.formatMessage(messages[headerI18nKey]) : header}
  </Grid>
)

FormSectionHeader.propTypes = {
  intl: PropTypeOf.intl.isRequired,
  header: PropTypes.string.isRequired,
  headerI18nKey: PropTypes.string,
}

FormSectionHeader.defaultProps = {
  headerI18nKey: null,
}

export default FormSectionHeader
