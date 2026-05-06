import React from 'react'
import { Grid } from '@mui/material'
import { Form, useFormikContext } from 'formik'
import PropTypes from 'prop-types'
import styles from './Form.module.css'
import FormSection from './FormSection'
import FormSectionHeader from './FormSectionHeader'
import formMessagesBase from './messages'

const AspectForm = ({ config: { sections, classNames, messages: customMessages } }) => {
  const { formik, toggleEdit } = useFormikContext()
  const messages = {
    ...formMessagesBase,
    ...customMessages,
  }

  classNames = classNames || {}

  const classes = `${styles.form__container} ${classNames.container ? styles[classNames.container] : ''}`
  return (
    <Grid container className={classes}>
      <Form noValidate autoComplete="off" className={styles.form__parent}>
        {sections &&
          sections.map(
            ({ id, label, labelI18nKey, headerNoteI18nKey, rows, hideHeader, classNames = {}, visibleIf }) => {
              if (visibleIf && !visibleIf(formik.values, toggleEdit)) {
                return null
              }
              return (
                <Grid key={id} item xs={12} className={styles.form__sectionContainer}>
                  <Grid container>
                    {hideHeader ? null : (
                      <FormSectionHeader
                        classNames={classNames}
                        header={label}
                        headerI18nKey={labelI18nKey}
                        headerNoteI18nKey={headerNoteI18nKey}
                        messages={messages}
                      />
                    )}
                    <FormSection
                      classNames={classNames}
                      fullWidth={hideHeader === true}
                      messages={messages}
                      rows={rows}
                      parentKey={id}
                    />
                  </Grid>
                </Grid>
              )
            }
          )}
      </Form>
    </Grid>
  )
}

AspectForm.propTypes = {
  config: PropTypes.oneOfType([PropTypes.object]).isRequired,
}

export default AspectForm
