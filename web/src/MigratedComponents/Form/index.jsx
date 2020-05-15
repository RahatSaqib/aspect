import React from 'react'
import PropTypes from 'prop-types'
import { useFormik } from 'formik'
import { useIntl } from 'react-intl'
import classnames from 'classnames/bind'
import Grid from '@material-ui/core/Grid'
import Card from '@material-ui/core/Card'

import FormSection from './FormSection'
import FormSectionHeader from './FormSectionHeader'
import {
  buildErrorMessage,
  createValidationSchema,
  buildLabel,
  pickKeys,
} from './Formik/Helpers'

const cssClasses = classnames.bind(require('./Form.css'))

const AspectForm = ({ config }) => {
  //   console.log(config)
  const { formatMessage: intlFormatMessage } = useIntl()
  const { sections } = config
  const initialValues = pickKeys(sections, ['initialValue'])

  const formik = useFormik({
    initialValues,
    // validationSchema: createValidationSchema(items, intlFormatMessage),
    validateOnMount: false,
    // onSubmit: this can be a dynamic redux action and database table can be passed along from schema
    onSubmit: values => console.log(JSON.stringify(values, null, 2)),
  })
  return (
    <Grid container className={cssClasses('form__container')}>
      {sections &&
        sections.map(({ id, header, items }) => (
          <Grid item xs={12} className={cssClasses('form__sectionContainer')}>
            <Grid container>
              <FormSectionHeader header={header} />
              <FormSection items={items} formik={formik} />
            </Grid>
          </Grid>
        ))}
    </Grid>
  )
}

// AspectForm.propTypes = {}

export default AspectForm
