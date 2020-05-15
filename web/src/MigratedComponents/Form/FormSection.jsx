import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import Grid from '@material-ui/core/Grid'

import { buildLabel } from './Formik/Helpers'
import FormItem from './FormItem'

const cssClasses = classnames.bind(require('./Form.css'))

const FormSection = ({ items, formik }) => {
  const { getFieldProps } = formik
  return (
    <Grid item xs={10}>
      <Grid container className={cssClasses('form__sectionItemsContainer')}>
        {items &&
          items.map(item => {
            return (
              <FormItem
                id={item.key}
                input={item.input}
                formikFieldProps={{ ...getFieldProps(item.key) }}
                label={buildLabel(item.label, false)}
              />
            )
          })}
      </Grid>
    </Grid>
  )
}

// FormSection.propTypes = {}

export default FormSection
