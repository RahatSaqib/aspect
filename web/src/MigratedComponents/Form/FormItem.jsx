import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import Grid from '@material-ui/core/Grid'

import { useFormikState } from './Formik/Context'
import { buildLabel } from './Formik/Helpers'
import AspectInput from './Inputs'

const cssClasses = classnames.bind(require('./Form.css'))

const FormItem = ({
  id,
  label,
  type,
  controlType,
  hideIfNull,
  initialValue,
}) => {
  const { formik, toggleEdit } = useFormikState()
  const { getFieldProps } = formik

  return !hideIfNull && initialValue ? (
    <Grid
      item
      xs={12}
      md={6}
      lg={4}
      className={cssClasses('form__sectionItemContainer')}
    >
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
        formik={formik}
      />
    </Grid>
  ) : null
}

FormItem.defaultProps = {
  hideIfNull: false,
}

FormItem.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  controlType: PropTypes.string.isRequired,
  hideIfNull: PropTypes.bool,
  initialValue: PropTypes.string.isRequired,
}

export default FormItem
