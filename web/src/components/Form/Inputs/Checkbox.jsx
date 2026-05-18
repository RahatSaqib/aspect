import React from 'react'
import { FormControl, FormHelperText } from '@mui/material'
import { useFormikContext } from 'formik'
import get from 'lodash/get'
import PropTypes from 'prop-types'
import CheckboxField from '../../../components/shared/CheckboxField'
import { getFieldErrorProps } from '../Formik/Helpers'

const Checkbox = props => {
  const { className, classNames, formik, id, label } = props
  const { updateField, toggleEdit } = useFormikContext()
  const { error, helperText } = getFieldErrorProps(formik, id)

  return (
    <FormControl component="fieldset" fullWidth>
      <CheckboxField
        checked={get(formik.values, id)}
        className={className}
        classNames={classNames}
        label={label}
        name={id}
        onChange={event => {
          updateField(id, event.target.checked, { formik, toggleEdit, shouldValidate: true })
        }}
        disabled={props.InputProps.readOnly}
      />
      {error && helperText ? <FormHelperText error>{helperText}</FormHelperText> : null}
    </FormControl>
  )
}

Checkbox.defaultProps = {
  className: '',
  classNames: {},
  label: '',
}

Checkbox.propTypes = {
  className: PropTypes.string,
  classNames: PropTypes.objectOf(PropTypes.shape),
  id: PropTypes.string.isRequired,
  label: PropTypes.string,
  formik: PropTypes.oneOfType([PropTypes.object]).isRequired,
  // eslint-disable-next-line react/require-default-props
  InputProps: PropTypes.any,
}
export default Checkbox
