import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import Grid from '@material-ui/core/Grid'

const cssClasses = classnames.bind(require('./Form.css'))

const FormItem = ({ label }) => (
  <Grid item xs={4} className={cssClasses('form__sectionItemContainer')}>
    {label}
  </Grid>
)

// FormItem.propTypes = {}

export default FormItem
