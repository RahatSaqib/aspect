/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import { useQuery } from 'react-query'
import Select from 'react-select'
import get from 'lodash/get'
import sortBy from 'lodash/sortBy'
import filter from 'lodash/filter'

import fetchWrapperForQueries from '../QueryFetch'

const cssClasses = classnames.bind(require('./Dropdown.css'))

const {
  '--aspect-color-chill-blue-1': aspectChillBlue1,
  '--aspect-color-chill-blue-3': aspectChillBlue3,
  '--aspect-color-white': aspectWhite,
  '--white-lilac-2': lilac2,
} = process.env

function indexForDefaultSelected(data, defaultOption) {
  if (typeof defaultOption === 'object') {
    const { key, value } = defaultOption
    const selectValue = filter(data, { [key]: value })
    if (selectValue && selectValue.length) {
      return selectValue[0]
    }
    return false
  }
  if (typeof defaultOption === 'number') {
    return data[defaultOption]
  }
  return false
}

const buildCustomStyles = () => {
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
    dropdownIndicator: provided => ({
      ...provided,
      ':hover': aspectWhite,
      color: aspectWhite,
      padding: '8px 0 8px 8px',
    }),
    input: provided => ({
      ...provided,
      color: aspectWhite,
    }),
    singleValue: provided => ({
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
  keyMapping: { idKey, nameKey },
  isClearable,
  defaultSelectedOption,
}) => {
  const defaultOptionValue = indexForDefaultSelected(
    data,
    defaultSelectedOption
  )
  const [defaultOption] = useState(selectedValue)
  const [inputValue, setInputValue] = useState(false)

  useEffect(() => {
    if (inputValue) {
      const { selectedOption, action } = inputValue
      dispatchFromRedux({ identifier, selectedOption, action })
    }
  }, [inputValue])

  return (
    <div className={cssClasses('select__container')}>
      <Select
        getOptionLabel={val => val[nameKey]}
        getOptionValue={val => val[idKey]}
        isClearable={isClearable}
        defaultValue={defaultOptionValue}
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

SelectComponent.defaultProps = {
  keyMapping: {
    idKey: 'id',
    nameKey: 'name',
  },
  isClearable: true,
  defaultSelectedOption: false,
}

SelectComponent.propTypes = {
  keyMapping: PropTypes.oneOf([PropTypes.object]),
  data: PropTypes.oneOf([PropTypes.object]).isRequired,
  selectedValue: PropTypes.string.isRequired,
  action: PropTypes.func.isRequired,
  identifier: PropTypes.string.isRequired,
  isClearable: PropTypes.bool,
  defaultSelectedOption: PropTypes.oneOf([PropTypes.bool, PropTypes.number]),
}

const AspectDropdown = ({
  props: {
    selectedValue,
    state: reduxStateId,
    identifier,
    endpoint,
    data: passedData,
    sortByKeys,
    keyMapping,
    isClearable,
    defaultSelectedOption,
  },
  action,
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

  return selectOptions && selectOptions.length ? (
    <SelectComponent
      data={sortBy(get(data, reduxStateId), sortByKeys)}
      selectedValue={selectedValue}
      action={action}
      identifier={identifier}
      keyMapping={keyMapping}
      isClearable={isClearable}
      defaultSelectedOption={defaultSelectedOption}
    />
  ) : null
}

AspectDropdown.defaulProps = {
  props: {
    sortByKeys: ['name'],
    keyMapping: {},
  },
  isClearable: true,
  defaultSelectedOption: false,
}

AspectDropdown.propTypes = {
  props: PropTypes.shape({
    selectedValue: PropTypes.string.isRequired,
    state: PropTypes.string.isRequired,
    identifier: PropTypes.string.isRequired,
    endpoint: PropTypes.string.isRequired,
    data: PropTypes.bool,
    sortByKeys: PropTypes.oneOf([PropTypes.array]),
    keyMapping: PropTypes.shape({
      idKey: PropTypes.string,
      nameKey: PropTypes.string,
    }),
    isClearable: PropTypes.bool,
    defaultSelectedOption: PropTypes.oneOf([PropTypes.bool, PropTypes.number]),
  }).isRequired,
  action: PropTypes.func.isRequired,
}

export default AspectDropdown
