import React from 'react'
import { Grid } from '@mui/material'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import styles from './Form.module.css'

const FormSectionHeader = ({ classNames, header, headerI18nKey, messages }) => {
  const { formatMessage } = useIntl()

  const classes = `${styles.form__sectionHeader} ${classNames.sectionHeader ? styles[classNames.sectionHeader] : ''}`
  return (
    <Grid item xs={2} className={classes} id={headerI18nKey}>
      {headerI18nKey ? formatMessage(messages[headerI18nKey]) : header}
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
