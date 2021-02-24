import React, { useMemo } from 'react'
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
  link,
  type,
  controlType,
  hideIfNull,
  initialValue,
  containerClassName,
  itemClassName,
}) => {
  const { formik, toggleEdit } = useFormikState()
  const { getFieldProps } = formik

  const inputProps = useMemo(() => {
    return {
      readOnly: !toggleEdit,
      disabled: !toggleEdit || type === 'readOnly',
      disableUnderline: !toggleEdit || type === 'readOnly',
    }
  }, [toggleEdit, type])

  const inputLabelProps = useMemo(() => {
    return {
      shrink: true,
    }
  }, [])

  return !hideIfNull || initialValue ? (
    <Grid
      item
      xs={12}
      md={6}
      lg={4}
      className={cssClasses('form__sectionItemContainer', {
        [containerClassName]: !!containerClassName,
      })}
    >
      <AspectInput
        {...getFieldProps(id)}
        id={id}
        input={type}
        controlType={controlType}
        label={buildLabel(label, false)}
        link={link}
        placeholder=" - "
        className={cssClasses('form__sectionItemInput', {
          'form__sectionItemInput--enabled': toggleEdit,
          'form__sectionItemInput--disabled': !toggleEdit,
          [itemClassName]: !!itemClassName,
        })}
        fullWidth
        InputProps={inputProps}
        InputLabelProps={inputLabelProps}
        formik={formik}
      />
    </Grid>
  ) : null
}

FormItem.defaultProps = {
  hideIfNull: false,
  link: false,
  containerClassName: '',
  itemClassName: '',
}

FormItem.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  link: PropTypes.oneOf([PropTypes.object, PropTypes.bool]),
  type: PropTypes.string.isRequired,
  controlType: PropTypes.objectOf(PropTypes.shape).isRequired,
  hideIfNull: PropTypes.bool,
  initialValue: PropTypes.string.isRequired,
  containerClassName: PropTypes.string,
  itemClassName: PropTypes.string,
}

export default FormItem
