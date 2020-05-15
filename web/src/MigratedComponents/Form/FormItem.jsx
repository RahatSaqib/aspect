import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import Grid from '@material-ui/core/Grid'

import AspectInput from './Inputs'

const cssClasses = classnames.bind(require('./Form.css'))

const FormItem = ({ id, label, input, formikFieldProps }) => {
  console.log(label, formikFieldProps)

  //   return <div>hey</div>

  return (
    <Grid item xs={4} className={cssClasses('form__sectionItemContainer')}>
      <AspectInput
        {...formikFieldProps}
        id={id}
        type={input.type}
        controlType={input.component}
        label={label}
        // className={formCssClasses(...classes)}
        // {...buildErrorMessage(formik, id)}
      />
    </Grid>
  )
}

// FormItem.propTypes = {}

export default FormItem
