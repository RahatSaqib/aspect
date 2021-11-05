import React from 'react'
// import { defineMessages, useIntl } from 'react-intl'
import { useIntl } from 'react-intl'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import Grid from '@material-ui/core/Grid'

import styles from './Form.css'

const cssClasses = classnames.bind(styles)

const FormSectionHeader = ({ classNames, header, headerI18nKey, messages }) => {
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
