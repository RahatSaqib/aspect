/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { useQuery } from 'react-query'
import Select from 'react-select'
import sortBy from 'lodash/sortBy'

import fetchWrapperForQueries from '../QueryFetch'

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

const SelectComponent = ({
  data,
  selectedValue,
  action: dispatchFromRedux,
  identifier,
}) => {
  const [defaultOption] = useState(selectedValue)
  const [inputValue, setInputValue] = useState(false)
  useEffect(() => {
    if (inputValue) {
      const { selectedOption, action } = inputValue
      dispatchFromRedux({ identifier, selectedOption, action })
    }
  }, [inputValue])
  console.log(inputValue, selectedValue)

  return (
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
  )
}

const AspectDropdown = ({
  props: {
    selectedValue,
    state: reduxStateId,
    identifier,
    endpoint,
    data: passedData,
    sortByKeys = ['name'],
  },
  action,
}) => {
  const { isError, data = false, error } = useQuery(
    reduxStateId,
    async () => (endpoint ? fetchWrapperForQueries(endpoint) : passedData),
    {
      initialData: passedData,
      initialStale: true,
    }
  )

  if (isError) {
    throw new Error(error)
  }

  return data && data[reduxStateId] && data[reduxStateId].length ? (
    <SelectComponent
      data={sortBy(data[reduxStateId], sortByKeys)}
      selectedValue={selectedValue}
      action={action}
      identifier={identifier}
    />
  ) : null
}

AspectDropdown.propTypes = {
  props: PropTypes.shape({
    selectedValue: PropTypes.string.isRequired,
    state: PropTypes.string.isRequired,
    identifier: PropTypes.string.isRequired,
    endpoint: PropTypes.string.isRequired,
    data: PropTypes.bool,
    sortByKeys: PropTypes.oneOf([PropTypes.array]),
  }).isRequired,
  action: PropTypes.func.isRequired,
}

export default AspectDropdown
