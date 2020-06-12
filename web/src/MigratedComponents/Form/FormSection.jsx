import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import Grid from '@material-ui/core/Grid'

import FormItem from './FormItem'

const cssClasses = classnames.bind(require('./Form.css'))

const FormSection = ({ rows }) => {
  return (
    <Grid item xs={10}>
      {rows &&
        rows.map(({ items }) => (
          <Grid container className={cssClasses('form__sectionItemsContainer')}>
            {items && items.map(item => <FormItem {...item} />)}
          </Grid>
        ))}
    </Grid>
  )
}

// FormSection.propTypes = {}

export default FormSection
