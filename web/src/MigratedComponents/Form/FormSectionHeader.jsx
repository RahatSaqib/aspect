import React from 'react'
import { defineMessages, useIntl } from 'react-intl'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import Grid from '@material-ui/core/Grid'

const cssClasses = classnames.bind(require('./Form.css'))

const messagesBase = {
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

const FormSectionHeader = ({
  classNames,
  header,
  headerI18nKey,
  messages = messagesBase,
}) => {
  const intl = useIntl()
  return (
    <Grid
      item
      xs={2}
      className={cssClasses('form__sectionHeader', {
        [classNames.sectionHeader]: !!classNames.sectionHeader,
      })}
    >
      {headerI18nKey ? intl.formatMessage(messages[headerI18nKey]) : header}
    </Grid>
  )
}

FormSectionHeader.propTypes = {
  classNames: PropTypes.objectOf(PropTypes.shape),
  header: PropTypes.string.isRequired,
  headerI18nKey: PropTypes.string,
  messages: PropTypes.objectOf(PropTypes.shape).isRequired,
}

FormSectionHeader.defaultProps = {
  classNames: {},
  headerI18nKey: null,
}

export default FormSectionHeader
