import React from 'react'
import PropTypes from 'prop-types'
import isArray from 'lodash/isArray'
import isFunction from 'lodash/isFunction'

import FormControl from '@material-ui/core/FormControl'
import FormHelperText from '@material-ui/core/FormHelperText'

import { useFormikState } from '../Formik/Context'
import AspectDropDown from '../../AspectDropDown'
import UI_CONSTS from '../../../globals/consts/UI'

const AspectSelect = props => {
  const { updateField } = useFormikState()
  const {
    className,
    classNames,
    controlType: {
      dependencies,
      endpoint,
      hideIfNoOptions = true,
      isMulti,
      normalizeLoadedData,
      options = [],
      placeholder,
      queryKey,
    },
    formik,
    id,
    label,
  } = props

  const isTouched = formik.touched[id] === true
  const error = isTouched && formik.errors[id]?.length > 0
  const helperText = isTouched && formik.errors[id]

  return (
    <FormControl className={className} error={error}>
      {/* eslint-disable jsx-a11y/label-has-for */}
      <label className={classNames.controlLabel} htmlFor={id}>
        {label}
      </label>
      <AspectDropDown
        props={{
          classNames,
          data: {
            [id]: options,
          },
          defaultSelectedOption: formik.values[id],
          dependencies,
          endpoint: isFunction(endpoint) ? endpoint(formik) : endpoint,
          formik,
          hideIfNoOptions,
          identifier: id,
          isClearable: false,
          isMulti,
          keyMapping: {
            idKey: 'value',
            nameKey: 'label',
          },
          normalizeLoadedData,
          placeholder: isFunction(placeholder)
            ? placeholder(formik)
            : placeholder,
          state: queryKey
            ? isFunction(queryKey)
              ? queryKey(formik)
              : queryKey
            : id,
        }}
        action={({ identifier, selectedOption }) => {
          const value = selectedOption
            ? isArray(selectedOption)
              ? selectedOption
              : selectedOption.value // selected value
            : formik.initialValues[id] // reset to initial value
          updateField(identifier, value, formik)
        }}
        theme={UI_CONSTS.themeName.mui}
      />
      {error && helperText ? (
        <FormHelperText>{helperText}</FormHelperText>
      ) : null}
    </FormControl>
  )
}

AspectSelect.defaultProps = {
  className: '',
  classNames: {},
  label: '',
}

AspectSelect.propTypes = {
  className: PropTypes.string,
  classNames: PropTypes.objectOf(PropTypes.shape),
  controlType: PropTypes.objectOf(PropTypes.shape).isRequired,
  formik: PropTypes.oneOfType([PropTypes.object]).isRequired,
  id: PropTypes.string.isRequired,
  label: PropTypes.string,
}
export default AspectSelect
