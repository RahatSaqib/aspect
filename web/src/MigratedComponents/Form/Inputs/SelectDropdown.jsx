import React, { useState } from 'react'
import Select, { components } from 'react-select'
import MUISelect from '@material-ui/core/Select'
import TextField from '@material-ui/core/TextField'

const colourOptions = [
  { value: 'ocean', label: 'Ocean', color: '#00B8D9', isFixed: true },
  { value: 'blue', label: 'Blue', color: '#0052CC', isDisabled: true },
  { value: 'purple', label: 'Purple', color: '#5243AA' },
  { value: 'red', label: 'Red', color: '#FF5630', isFixed: true },
  { value: 'orange', label: 'Orange', color: '#FF8B00' },
  { value: 'yellow', label: 'Yellow', color: '#FFC400' },
  { value: 'green', label: 'Green', color: '#36B37E' },
  { value: 'forest', label: 'Forest', color: '#00875A' },
  { value: 'slate', label: 'Slate', color: '#253858' },
  { value: 'silver', label: 'Silver', color: '#666666' },
]

const CustomInput = props => {
  return (
    <components.Input {...props}>
      <TextField />
    </components.Input>
  )
}

const AspectSelectDropdown = props => {
  const { formik } = props
  const [isLoading, setIsLoading] = useState(false)
  const [isDisabled, setDisabled] = useState(false)

  const onInputChange = (val, action) => {
    console.log(val, action)
    // eslint-disable-next-line default-case
    // switch (action) {
    //   case 'set-value':
    //     formik.handleChange({ inputValue })
    // }
  }

  return (
    <Select
      className="basic-single"
      classNamePrefix="select"
      isDisabled={isDisabled}
      isLoading={isLoading}
      isClearable
      isSearchable
      name="color"
      defaultValue={colourOptions[1]}
      options={colourOptions}
      onInputChange={(val, action) => onInputChange(val, action)}
      //   {...props}
      //   components={{ CustomInput }}
    />
  )
}

export default AspectSelectDropdown
