import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import Grid from '@material-ui/core/Grid'

const cssClasses = classnames.bind(require('./Form.css'))

const FormSectionHeader = ({ header }) => (
  <Grid item xs={2} className={cssClasses('form__sectionHeader')}>
    {header}
  </Grid>
)

FormSectionHeader.propTypes = {
  header: PropTypes.string.isRequired,
}

export default FormSectionHeader
