import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import Grid from '@material-ui/core/Grid'

import FormItem from './FormItem'

const cssClasses = classnames.bind(require('./Form.css'))

const FormSection = ({ fullWidth, rows, sectionItemsContainerClassName }) => {
  return (
    <Grid item xs={fullWidth ? 12 : 10}>
      {rows &&
        rows.map(({ items }) => (
          <Grid
            container
            className={cssClasses('form__sectionItemsContainer', {
              [sectionItemsContainerClassName]: !!sectionItemsContainerClassName,
            })}
          >
            {items && items.map(item => <FormItem {...item} />)}
          </Grid>
        ))}
    </Grid>
  )
}

FormSection.defaultProps = {
  fullWidth: false,
  sectionItemsContainerClassName: '',
}

FormSection.propTypes = {
  rows: PropTypes.oneOfType([PropTypes.array]).isRequired,
  fullWidth: PropTypes.bool,
  sectionItemsContainerClassName: PropTypes.string,
}

export default FormSection
