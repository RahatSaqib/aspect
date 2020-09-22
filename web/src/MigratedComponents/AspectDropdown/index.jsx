/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { useQuery } from 'react-query'
import Select from 'react-select'
import get from 'lodash/get'
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
      width: '100%',
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
  initialOption = false,
  keyMapping: { idKey = 'id', nameKey = 'name' } = false,
}) => {
  const [defaultOption] = useState(selectedValue)
  const [inputValue, setInputValue] = useState(false)

  useEffect(() => {
    if (inputValue) {
      const { selectedOption, action } = inputValue
      console.log(action)

      switch (action) {
        case 'select-option':
          console.log({ selectedOption, action })
          dispatchFromRedux({ identifier, selectedOption, action })
          break

        case 'clear':
          console.log({ selectedOption: data[initialOption], action })
          dispatchFromRedux({
            identifier,
            selectedOption: data[initialOption],
            action,
          })

          break

        default:
          break
      }
    }
  }, [inputValue])

  // console.log(data)

  return (
    <div style={{ width: '240px', marginRight: '20px' }}>
      <Select
        menuPlacement="auto"
        menuPosition="fixed"
        defaultValue={initialOption ? data[initialOption] : null}
        getOptionLabel={val => val[nameKey]}
        getOptionValue={val => val[idKey]}
        isClearable={!initialOption}
        options={data}
        placeholder={defaultOption}
        styles={buildCustomStyles(defaultOption)}
        onChange={(selectedOption, { action }) =>
          setInputValue({ selectedOption, action })
        }
      />
    </div>
  )
}

const AspectDropdown = ({
  props: {
    selectedValue,
    state: reduxStateId,
    identifier,
    endpoint,
    data: passedData,
    sortByKeys,
    initialOption,
    keyMapping,
  },
  action,
  ...rest
}) => {
  const [selectOptions, setSelectOptions] = useState(false)
  const { isError, data = false, error } = useQuery(
    reduxStateId,
    async () => (endpoint ? fetchWrapperForQueries({ endpoint }) : passedData),
    {
      initialData: passedData,
      initialStale: true,
    }
  )

  useEffect(() => {
    if (data) {
      const dataSet = get(data, reduxStateId)
      if (dataSet && dataSet !== selectOptions) {
        setSelectOptions(dataSet)
      }
    }
  }, [data, selectOptions])

  if (isError) {
    throw new Error(error)
  }

  // console.log(selectedValue)

  return selectOptions && selectOptions.length ? (
    <SelectComponent
      data={sortBy(get(data, reduxStateId), sortByKeys)}
      selectedValue={selectedValue}
      action={action}
      identifier={identifier}
      initialOption={initialOption}
      keyMapping={keyMapping}
    />
  ) : null
}

AspectDropdown.defaulProps = {
  sortByKeys: ['name'],
  keyMapping: {
    idKey: 'id',
    nameKey: 'name',
  },
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
  keyMapping: PropTypes.shape({
    idKey: PropTypes.string,
    nameKey: PropTypes.string,
  }),
}

export default AspectDropdown
