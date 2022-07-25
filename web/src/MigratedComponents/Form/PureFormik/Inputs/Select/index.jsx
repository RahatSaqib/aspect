import React from 'react'
import startCase from 'lodash/startCase'
import filter from 'lodash/filter'
import TextField from '@material-ui/core/TextField'
import Autocomplete from '@material-ui/core/Autocomplete'

/**
 * this component should not contain **ANY**
 * new styles, logic or functions
 */

const PureSelect = props => {
  const { inputProps, form } = props
  const { id, disabled, label, type, variant, options, initialValue, renderOption: RenderComponent } = inputProps
  const { errors, touched, handleBlur, values, setFieldValue } = form
  const value = filter(options, { value: values[id] })[0] || {}
  return (
    <Autocomplete
      id={`select-${id}`}
      disabled={disabled}
      autoSelect
      options={options || []}
      getOptionLabel={option => option?.label || ''}
      defaultValue={initialValue}
      value={value}
      onChange={(_e, selected) => setFieldValue(id, selected?.value || '')}
      onBlur={handleBlur}
      renderOption={(props, option) =>
        RenderComponent ? <RenderComponent {...props} option={option} /> : <div {...props}>{option.label}</div>
      }
      renderInput={params => (
        <TextField
          {...params}
          fullWidth
          id={id}
          name={id}
          label={label || startCase(id)}
          type={type}
          inputProps={{
            ...params.inputProps,
            autoComplete: `select-${id}`,
          }}
          variant={variant || 'standard'}
          error={touched[id] && Boolean(errors[id])}
          helperText={touched[id] && errors[id]}
        />
      )}
    />
  )
}

PureSelect.whyDidYouRender = false

export default PureSelect
