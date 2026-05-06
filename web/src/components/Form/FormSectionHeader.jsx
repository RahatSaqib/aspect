import React from 'react'
import { Grid, Typography } from '@mui/material'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import styles from './Form.module.css'

const FormSectionHeader = ({ classNames, header, headerI18nKey, headerNoteI18nKey, messages }) => {
  const { formatMessage } = useIntl()

  const classes = `${styles.form__sectionHeader} ${classNames.sectionHeader ? styles[classNames.sectionHeader] : ''}`
  const noteMessage =
    headerNoteI18nKey && messages[headerNoteI18nKey] ? formatMessage(messages[headerNoteI18nKey]) : null

  return (
    <Grid item xs={2} className={classes} id={headerI18nKey}>
      <Grid container direction="column" spacing={0.5}>
        <Grid item>{headerI18nKey ? formatMessage(messages[headerI18nKey]) : header}</Grid>
        {noteMessage ? (
          <Grid item>
            <Typography component="span" variant="caption" color="text.secondary">
              {noteMessage}
            </Typography>
          </Grid>
        ) : null}
      </Grid>
    </Grid>
  )
}

FormSectionHeader.propTypes = {
  classNames: PropTypes.objectOf(PropTypes.shape),
  header: PropTypes.string.isRequired,
  headerI18nKey: PropTypes.string,
  headerNoteI18nKey: PropTypes.string,
  messages: PropTypes.objectOf(PropTypes.shape).isRequired,
}

FormSectionHeader.defaultProps = {
  classNames: {},
  headerI18nKey: null,
  headerNoteI18nKey: null,
}

export default FormSectionHeader
