import React from 'react'
import Grid from '@mui/material/Grid'
import classnames from 'classnames/bind'
import PropTypes from 'prop-types'
import useI18n from '../../hooks/useI18n'
import styles from './Form.css'

const cssClasses = classnames.bind(styles)

const FormSectionHeader = ({ classNames, header, headerI18nKey, messages }) => {
  const { formatMessage } = useI18n()
  return (
    <Grid
      item
      xs={2}
      className={cssClasses('form__sectionHeader', {
        [classNames.sectionHeader]: !!classNames.sectionHeader,
      })}
    >
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
