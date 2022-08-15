import React from 'react'
import PropTypes from 'prop-types'
import get from 'lodash/get'
import isArray from 'lodash/isArray'
import isFunction from 'lodash/isFunction'

import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import { useFormikContext } from 'formik'

import AspectDropDown from '../../AspectDropDown'
import UI_CONSTS from '../../../globals/consts/UI'

const getPlaceholder = (placeholder, formik) => {
  if (isFunction(placeholder)) {
    return placeholder(formik)
  }
  return placeholder
}
const getState = (queryKey, formik, defaultValue) => {
  if (!queryKey) {
    return defaultValue
  }
  if (isFunction(queryKey)) {
    return queryKey(formik)
  }
  return queryKey
}
const getValue = (selectedOption, formik, id) => {
  if (!selectedOption) {
    return formik.initialValues[id] // reset to initial value
  }
  if (isArray(selectedOption)) {
    return selectedOption // selected values in multiple-selection mode
  }
  return selectedOption.value // selected value
}

const AspectSelect = props => {
  const { updateField, toggleEdit } = useFormikContext()
  const {
    className,
    classNames,
    controlType: {
      dependencies,
      endpoint,
      hideIfNoOptions = true,
      isMulti,
      normalizeLoadedData,
      populateOnChange,
      options = [],
      placeholder,
      queryKey,
      subRowIndex,
      isClearable = false,
    },
    formik,
    id,
    label,
  } = props

  const isTouched = get(formik.touched, id) === true
  const error = isTouched && get(formik.errors, id)?.length > 0
  const helperText = isTouched && get(formik.errors, id)

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
          defaultSelectedOption: get(formik.values, id),
          dependencies,
          endpoint: isFunction(endpoint) ? endpoint(formik) : endpoint,
          formik,
          hideIfNoOptions,
          identifier: id,
          isClearable,
          isDisabled: get(props, 'InputProps.disabled'),
          isMulti,
          keyMapping: {
            idKey: 'value',
            nameKey: 'label',
          },
          normalizeLoadedData,
          placeholder: getPlaceholder(placeholder, formik),
          state: getState(queryKey, formik, id),
          subRowIndex,
          updateField,
          showLabelWhenDisabled: true,
        }}
        action={({ identifier, selectedOption, action }, dataSource) => {
          const value = action === 'clear' ? null : getValue(selectedOption, formik, id)

          updateField(identifier, value, { formik, toggleEdit })

          if (populateOnChange) {
            populateOnChange(value, { formik, toggleEdit }, dataSource || [])
          }
        }}
        theme={UI_CONSTS.themeName.mui}
      />
      {error && helperText ? <FormHelperText>{helperText}</FormHelperText> : null}
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
