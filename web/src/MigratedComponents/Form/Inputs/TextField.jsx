import React from 'react'
import PropTypes from 'prop-types'
import TextField from '@material-ui/core/TextField'

import isNil from 'lodash/isNil'
import omitBy from 'lodash/omitBy'

import FormHTMLLabel from '../FormHTMLLabel'
import { getFieldErrorProps } from '../Formik/Helpers'
import { useFormikState } from '../Formik/Context'

const AspectTextField = ({
  controlType: { rowsMax, rows } = {},
  formik,
  label,
  link,
  multiline,
  /**
   * below props are not used - need then to free `rest`
   */
  classNames,
  validate,
  ...rest
}) => {
  const { updateField } = useFormikState()

  const mergedProps = multiline
    ? {
        ...rest,
        ...omitBy({ maxRows: rowsMax, minRows: rows }, v => isNil(v)),
        label,
        multiline,
      }
    : {
        ...rest,
        label: link ? <FormHTMLLabel label={label} link={link} /> : label,
      }

  const onChangeLocal = event => {
    updateField(rest.id, event.target.value, formik)
  }

  return (
    <TextField
      {...mergedProps}
      onChange={onChangeLocal}
      {...getFieldErrorProps(formik, rest.id)}
    />
  )
}

AspectTextField.defaultProps = {
  classNames: null,
  link: false,
  multiline: false,
  validate: null,
}

AspectTextField.propTypes = {
  controlType: PropTypes.oneOfType([PropTypes.object]).isRequired,
  formik: PropTypes.oneOfType([PropTypes.object]).isRequired,
  label: PropTypes.oneOfType([PropTypes.object, PropTypes.string]).isRequired,
  link: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
  multiline: PropTypes.bool,
  /**
   * below props are not used - need them to free `rest`
   */
  classNames: PropTypes.oneOfType([PropTypes.object]),
  validate: PropTypes.func,
}

export default AspectTextField
