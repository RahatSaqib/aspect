/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { useSelector } from 'react-redux'
import Select from 'react-select'
import get from 'lodash/get'
import sortBy from 'lodash/sortBy'

const {
  '--aspect-color-chill-blue-1': aspectChillBlue1,
  '--aspect-color-chill-blue-3': aspectChillBlue3,
  '--aspect-color-white': aspectWhite,
  '--white-lilac-2': lilac2,
} = process.env

const buildCustomStyles = defaultOption => {
  const styles = {
    option: (provided, state) => {
      const { isSelected, isFocused } = state
      return {
        ...provided,
        color: isSelected ? aspectWhite : aspectChillBlue1,
        backgroundColor:
          (isSelected && aspectChillBlue3) || (isFocused && lilac2),
      }
    },
    control: provided => ({
      ...provided,
      width: 200,
      backgroundColor: aspectChillBlue1,
      display: 'flex',
      borderRadius: '5px',
      padding: '0 8px 0',
      margin: '0 0 0 5px',
    }),
    placeholder: provided => ({
      ...provided,
      color: aspectWhite,
    }),
    clearIndicator: provided => ({
      ...provided,
      ':hover': aspectWhite,
      color: aspectWhite,
    }),
    dropdownIndicator: (provided, state) => ({
      ...provided,
      ':hover': aspectWhite,
      color: aspectWhite,
      padding: '8px 0 8px 8px',
    }),
    input: provided => ({
      ...provided,
      color: aspectWhite,
    }),
    singleValue: (provided, state) => ({
      ...provided,
      color: aspectWhite,
    }),
  }

  return styles
}

const AspectDropdown = ({
  selectedValue,
  reduxStateId,
  action: dispatchFromRedux,
  identifier,
  data: passedData,
}) => {
  const [defaultOption] = useState(selectedValue)
  const [inputValue, setInputValue] = useState(false)
  const [data, setData] = useState(false)
  const reduxData = useSelector(state => get(state.toJS(), reduxStateId))

  useEffect(() => {
    if (!data) {
      setData(passedData || sortBy(reduxData, ['name']))
    }
  }, [reduxData])

  useEffect(() => {
    if (inputValue) {
      const { selectedOption, action } = inputValue
      dispatchFromRedux({ identifier, selectedOption, action })
    }
  }, [inputValue])

  return data && data.length ? (
    <Select
      getOptionLabel={({ name }) => name}
      getOptionValue={({ id }) => id}
      isClearable
      options={data}
      placeholder={defaultOption}
      styles={buildCustomStyles(defaultOption)}
      onChange={(selectedOption, { action }) =>
        setInputValue({ selectedOption, action })
      }
    />
  ) : null
}

AspectDropdown.defaultProps = {
  data: false,
}

AspectDropdown.propTypes = {
  selectedValue: PropTypes.string.isRequired,
  reduxStateId: PropTypes.string.isRequired,
  action: PropTypes.func.isRequired,
  identifier: PropTypes.string.isRequired,
  data: PropTypes.bool,
}

export default AspectDropdown
