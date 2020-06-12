import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import Grid from '@material-ui/core/Grid'

import { useFormikState } from './Formik/Context'

import {
  buildErrorMessage,
  createValidationSchema,
  buildLabel,
} from './Formik/Helpers'

import AspectInput from './Inputs'

const cssClasses = classnames.bind(require('./Form.css'))

const FormItem = ({ id, label, type, controlType }) => {
  const { formik, toggleEdit } = useFormikState()
  const { getFieldProps } = formik
  // console.log(id, type)

  return (
    <Grid item xs={4} className={cssClasses('form__sectionItemContainer')}>
      <AspectInput
        {...getFieldProps(id)}
        id={id}
        input={type}
        controlType={controlType}
        label={buildLabel(label, false)}
        placeholder=" - "
        className={cssClasses('form__sectionItemInput', {
          'form__sectionItemInput--enabled': toggleEdit,
          'form__sectionItemInput--disabled': !toggleEdit,
        })}
        fullWidth
        InputProps={{
          readOnly: !toggleEdit,
          disabled: !toggleEdit || type === 'readOnly',
          disableUnderline: !toggleEdit || type === 'readOnly',
        }}
        InputLabelProps={{
          shrink: true,
        }}
        autoFocus
        // {...buildErrorMessage(formik, id)}
      />
    </Grid>
  )
}

// FormItem.propTypes = {}

export default FormItem
