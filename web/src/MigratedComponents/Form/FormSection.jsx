import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import Grid from '@material-ui/core/Grid'

import FormItem from './FormItem'

const cssClasses = classnames.bind(require('./Form.css'))

const FormSection = ({ fullWidth, rows, classNames }) => {
  return (
    <Grid item xs={fullWidth ? 12 : 10}>
      {rows &&
        rows.map(({ items }) => (
          <Grid
            container
            className={cssClasses('form__sectionItemsContainer', {
              [classNames.container]: !!classNames.container,
            })}
          >
            {items && items.map(item => <FormItem {...item} />)}
          </Grid>
        ))}
    </Grid>
  )
}

FormSection.defaultProps = {
  classNames: {},
  fullWidth: false,
}

FormSection.propTypes = {
  classNames: PropTypes.objectOf(PropTypes.shape),
  fullWidth: PropTypes.bool,
  rows: PropTypes.oneOfType([PropTypes.array]).isRequired,
}

export default FormSection
