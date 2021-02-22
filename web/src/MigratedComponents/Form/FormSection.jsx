import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import Grid from '@material-ui/core/Grid'

import FormItem from './FormItem'
import PropTypeOf from '../../shared/types'

const cssClasses = classnames.bind(require('./Form.css'))

const FormSection = ({ intl, rows }) => {
  return (
    <Grid item xs={10}>
      {rows &&
        rows.map(({ items }) => (
          <Grid container className={cssClasses('form__sectionItemsContainer')}>
            {items && items.map(item => <FormItem {...item} intl={intl} />)}
          </Grid>
        ))}
    </Grid>
  )
}

FormSection.propTypes = {
  rows: PropTypes.oneOfType([PropTypes.array]).isRequired,
  intl: PropTypeOf.intl.isRequired,
}

export default FormSection
