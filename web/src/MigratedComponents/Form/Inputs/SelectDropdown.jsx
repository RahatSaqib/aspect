/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react'
import Select, { components } from 'react-select'
import { useDispatch, useSelector } from 'react-redux'
import get from 'lodash/get'
import MUISelect from '@material-ui/core/Select'
import TextField from '@material-ui/core/TextField'
// import s from '../../../assay/AssayRedux'

const colourOptions = [
  { value: 'ocean', label: 'Ocean', color: '#00B8D9', isFixed: true },
  { value: 'blue', label: 'Blue', color: '#0052CC', isDisabled: true },
  { value: 'purple', label: 'Purple', color: '#5243AA' },
  { value: 'red', label: 'Red', color: '#FF5630', isFixed: true },
  { value: 'orange', label: 'Orange', color: '#FF8B00' },
  { value: 'yellow', label: 'Yellow', color: '#FFC400' },
  { value: 'green', label: 'Green', color: '#36B37E' },
  { value: 'aspect', label: 'Aspect', color: '#ccffcc' },
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

const getIndexOfValue = value => colourOptions.findIndex(a => a.label === value)

const AspectSelectDropdown = props => {
  const dispatch = useDispatch()
  const { formik, id, value, InputProps, controlType } = props
  const {
    stateId,
    reduxFile,
    reduxFunction,
    inputLabel,
    InputValue,
  } = controlType
  //   console.log(props)
  //   const initialIndex = getIndexOfValue(formik.initialValues[id])
  //   const [selectedValue, setSelectedValue] = useState(
  //     colourOptions[initialIndex]
  //   )
  const [selected, setSelected] = useState()
  const [calledRedux, setCalledRedux] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [whiteListed, setWhiteListed] = useState(false)
  const reduxData = useSelector(state =>
    stateId ? get(state.toJS(), 'assay.items') : setCalledRedux(true)
  )

  useEffect(() => {
    if (selected) {
      const { selectedOption, action } = selected
      console.log(selected, selectedOption, action)
      switch (action) {
        case 'clear':
          formik.setFieldValue(id, value)
          //   setSelectedValue(colourOptions[initialIndex])
          break

        case 'select-option':
          formik.setFieldValue(id, selectedOption.name)
          //   setSelectedValue(colourOptions[getIndexOfValue(selectedOption.label)])
          break

        default:
          break
      }
    }
  }, [selected])

  useEffect(() => {
    if (!reduxData || reduxData.length < 1 || !calledRedux) {
      console.log(reduxFile)

      import(`../../../${reduxFile}`)
        .then(Module => dispatch(Module[reduxFunction](false)))
        .catch(err => console.error(err))
        .finally(() => setCalledRedux(true))
    }
    // console.log(reduxData, calledRedux, whiteListed)

    // if (reduxData && calledRedux && !whiteListed) {
    //   reduxData.filter(obj => {
    //     console.log(obj)
    //     return false
    //   })
    //   setWhiteListed([])
    // }
  }, [reduxData])

  console.log(reduxData)
  // console.log(whiteListed)

  return (
    <Select
      getOptionLabel={obj => obj[inputLabel]}
      getOptionValue={obj => obj[InputValue]}
      isDisabled={InputProps.disabled}
      isLoading={!calledRedux}
      isClearable
      isSearchable
      options={reduxData}
      onChange={(selectedOption, { action }) =>
        setSelected({ selectedOption, action })
      }
      //   {...props}
      //   components={{ CustomInput }}
    />
  )
}

export default AspectSelectDropdown
