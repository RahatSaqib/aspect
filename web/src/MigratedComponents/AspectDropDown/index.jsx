/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import { useQuery } from 'react-query'
import Select from 'react-select'
import get from 'lodash/get'
import isEqual from 'lodash/isEqual'
import sortBy from 'lodash/sortBy'
import filter from 'lodash/filter'

import fetchWrapperForQueries from '../QueryFetch'
import UI_CONSTS from '../../globals/consts/UI'

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

const getAspectTheme = () => {
  return {
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
}
const getMuiTheme = () => {
  return {
    control: provided => ({
      ...provided,
      display: 'flex',
      alignItems: 'center',
      border: 0,
      height: 'auto',
      background: 'transparent',
      '&:hover': {
        boxShadow: 'none',
      },
      width: '100%',
      '&::before': {
        left: 0,
        right: 0,
        bottom: 0,
        content: '" "',
        position: 'absolute',
        transition:
          'border-bottom-color 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
        borderBottom: '1px solid rgba(0, 0, 0, 0.42)',
        pointerEvents: 'none',
      },
      '&::after': {
        left: 0,
        right: 0,
        bottom: 0,
        content: '""',
        position: 'absolute',
        transform: 'scaleX(0)',
        transition: 'transform 200ms cubic-bezier(0.0, 0, 0.2, 1) 0ms',
        borderBottom: '2px solid #689f38',
        pointerEvents: 'none',
      },
    }),
    menu: provided => ({
      ...provided,
      backgroundColor: aspectWhite,
      width: '100%',
    }),
    menuList: provided => ({
      ...provided,
      overflowY: 'auto',
    }),
    valueContainer: provided => ({
      ...provided,
      paddingLeft: 0,
    }),
    indicatorSeparator: provided => ({
      ...provided,
      display: 'none',
    }),
  }
}

const buildCustomStyles = theme => {
  if (theme === UI_CONSTS.themeName.mui) {
    return getMuiTheme()
  }

  if (theme === UI_CONSTS.themeName.aspect) {
    return getAspectTheme()
  }
}

const SelectComponent = ({
  classNames,
  data,
  selectedValue,
  action: dispatchFromRedux,
  identifier,
  keyMapping: { idKey, nameKey },
  isClearable,
  isLoading,
  defaultSelectedOption,
  theme,
}) => {
  const [busy, setBusy] = useState(true)
  const [defaultOptionValue, setDefaultOptionValue] = useState(false)
  const [defaultOption] = useState(selectedValue)
  const [inputValue, setInputValue] = useState(false)
  const [options, setOptions] = useState(false)

  useEffect(() => {
    if (inputValue) {
      const { selectedOption, action } = inputValue
      dispatchFromRedux({ identifier, selectedOption, action })
    }
  }, [inputValue])

  useEffect(() => {
    if (!isEqual(options, data) || !defaultOptionValue) {
      setDefaultOptionValue(
        indexForDefaultSelected(data, defaultSelectedOption)
      )
      setOptions(data)
    } else {
      setBusy(false)
    }
  }, [data, defaultSelectedOption])

  return !busy ? (
    <div
      className={cssClasses('select__container', {
        [classNames.controlContainer]: !!classNames.controlContainer,
      })}
    >
      <Select
        name={identifier}
        getOptionLabel={val => val[nameKey]}
        getOptionValue={val => val[idKey]}
        isClearable={isClearable}
        isLoading={isLoading}
        defaultValue={defaultOptionValue}
        options={data}
        placeholder={defaultOption}
        styles={buildCustomStyles(theme)}
        onChange={(selectedOption, { action }) =>
          setInputValue({ selectedOption, action })
        }
      />
    </div>
  ) : null
}

SelectComponent.defaultProps = {
  classNames: {},
  keyMapping: {
    idKey: 'id',
    nameKey: 'name',
  },
  isClearable: true,
  isLoading: false,
  defaultSelectedOption: false,
}

SelectComponent.propTypes = {
  classNames: PropTypes.oneOf([PropTypes.object]),
  keyMapping: PropTypes.oneOf([PropTypes.object]),
  data: PropTypes.oneOf([PropTypes.object]).isRequired,
  selectedValue: PropTypes.string.isRequired,
  action: PropTypes.func.isRequired,
  identifier: PropTypes.string.isRequired,
  isClearable: PropTypes.bool,
  isLoading: PropTypes.bool,
  defaultSelectedOption: PropTypes.oneOf([PropTypes.bool, PropTypes.number]),
  theme: PropTypes.string.isRequired,
}

const AspectDropDown = ({
  props: {
    classNames,
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
  theme,
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
      if (dataSet && !isEqual(dataSet, selectOptions)) {
        setSelectOptions(dataSet)
      }
    }
  }, [data, selectOptions])

  if (isError) {
    throw new Error(error)
  }

  return selectOptions && selectOptions.length ? (
    <SelectComponent
      classNames={classNames}
      data={sortBy(get(data, reduxStateId), sortByKeys)}
      selectedValue={selectedValue}
      action={action}
      identifier={identifier}
      keyMapping={keyMapping}
      isClearable={isClearable}
      defaultSelectedOption={defaultSelectedOption}
      theme={theme}
    />
  ) : null
}

AspectDropDown.defaultProps = {
  theme: UI_CONSTS.themeName.aspect,
}

AspectDropDown.propTypes = {
  props: PropTypes.shape({
    classNames: PropTypes.oneOf([PropTypes.object]),
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
  theme: PropTypes.string,
}

export default AspectDropDown
