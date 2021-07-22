/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import { useQuery } from 'react-query'
import Select, { components } from 'react-select'
import { defineMessages } from 'react-intl'

import get from 'lodash/get'
import find from 'lodash/find'
import isArray from 'lodash/isArray'
import isEqual from 'lodash/isEqual'
import isNil from 'lodash/isNil'
import isNumber from 'lodash/isNumber'
import isPlainObject from 'lodash/isPlainObject'
import isString from 'lodash/isString'
import pick from 'lodash/pick'
import sortBy from 'lodash/sortBy'
import values from 'lodash/values'

import useI18n from '../../Hooks/i18n/useI18n'
import fetchWrapperForQueries from '../QueryFetch'
import UI_CONSTS from '../../globals/consts/UI'

import styles from './Dropdown.css'

const messagesBase = defineMessages({
  noOptionsMessage: {
    id: 'base.noOptionsMessage',
    defaultMessage: 'No options',
  },
})

const cssClasses = classnames.bind(styles)

const defaultSelectedOptionPropType = PropTypes.oneOfType([
  PropTypes.bool,
  PropTypes.number,
  PropTypes.string,
  PropTypes.object,
  PropTypes.array,
])

const {
  '--aspect-color-chill-blue-1': aspectChillBlue1,
  '--aspect-color-chill-blue-3': aspectChillBlue3,
  '--aspect-color-white': aspectWhite,
  '--white-lilac-2': lilac2,
} = process.env

function getOptionByValue(data, requestedValue, idKey) {
  // When the requested value is an object including key and value props
  if (isPlainObject(requestedValue)) {
    const { key, value } = requestedValue
    return find(data, { [key]: value })
  }

  // When the requested value is a string key
  if (isString(requestedValue)) {
    // Take the option in different ways, depending on the data format
    if (isPlainObject(data)) return find(data, { [idKey]: requestedValue })

    if (isArray(data))
      return data.find(option => option[idKey] === requestedValue)

    if (isNumber(requestedValue))
      return data.find(option => option[idKey] === requestedValue)
  }

  // When the requested value is a position in the array
  if (isNumber(requestedValue)) return data[requestedValue]
}

function getSelectedOptions(data, someValue, idKey) {
  if (!data || data.length === 0 || isNil(someValue)) {
    return false
  }
  if (isArray(someValue)) {
    const options = someValue.map(value => getOptionByValue(data, value, idKey))
    return options
  }

  const option = getOptionByValue(data, someValue, idKey)
  return option || false
}

const styleOptionBase = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  lineHeight: 1,
  '& svg': {
    margin: '0 5px 0',
  },
}
const getAspectTheme = () => {
  return {
    option: (provided, state) => {
      const { isSelected, isFocused } = state
      return {
        ...provided,
        ...styleOptionBase,
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
      '& svg': {
        ...provided['& svg'],
        color: aspectWhite,
      },
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
    option: provided => ({
      ...provided,
      ...styleOptionBase,
    }),
    control: provided => ({
      ...provided,
      display: 'flex',
      alignItems: 'center',
      border: 0,
      height: 'auto',
      background: 'transparent',
      borderColor: 'transparent',
      boxShadow: 'none',
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
  action: dispatchFromRedux,
  classNames,
  components,
  data,
  defaultSelectedOption,
  identifier,
  isClearable,
  isLoading,
  isMulti,
  keyMapping: { idKey, nameKey = 'i18nKey' },
  messages,
  placeholder,
  selectedValue,
  theme,
}) => {
  messages = messages || {}
  const { formatMessage } = useI18n()
  const [busy, setBusy] = useState(true)
  const [defaultOptionValue, setDefaultOptionValue] = useState(false)
  const [defaultOption] = useState(selectedValue)
  const [, setInputValue] = useState(false)
  // const [currentValue, setCurrentValue] = useState(false)
  const [options, setOptions] = useState(false)

  // if defaultSelectedOption is true, then the default selection is set to the first element
  defaultSelectedOption =
    defaultSelectedOption && data?.length > 0
      ? data[0][idKey]
      : defaultSelectedOption

  useEffect(() => {
    if (!isEqual(options, data)) {
      setDefaultOptionValue(
        getSelectedOptions(data, defaultSelectedOption, idKey)
      )
      setOptions(data)
      setBusy(false)
    } else {
      setBusy(false)
    }
  }, [data, defaultSelectedOption])

  const onChange = (selectedOption, { action }) => {
    setInputValue({ selectedOption, action })
    dispatchFromRedux({ identifier, selectedOption, action })
  }
  return !busy ? (
    <div
      className={cssClasses('select__container', {
        [classNames.controlContainer]: !!classNames.controlContainer,
      })}
    >
      <Select
        components={components}
        name={identifier}
        id={identifier}
        getOptionLabel={val =>
          formatMessage(messages[val[nameKey]], {}, val[nameKey])
        }
        getOptionValue={val => val[idKey]}
        isClearable={isClearable}
        isLoading={isLoading}
        isMulti={isMulti}
        defaultValue={defaultOptionValue}
        options={data}
        placeholder={defaultOption || placeholder}
        styles={buildCustomStyles(theme)}
        onChange={onChange}
        noOptionsMessage={() => formatMessage(messagesBase.noOptionsMessage)}
      />
    </div>
  ) : null
}

SelectComponent.defaultProps = {
  classNames: {},
  components: undefined,
  defaultSelectedOption: undefined,
  isClearable: true,
  isLoading: false,
  isMulti: false,
  keyMapping: {
    idKey: 'id',
    nameKey: 'name',
  },
  messages: null,
  placeholder: 'Select...',
  selectedValue: '',
}

SelectComponent.propTypes = {
  action: PropTypes.func.isRequired,
  classNames: PropTypes.oneOfType([PropTypes.object]),
  components: PropTypes.oneOfType([PropTypes.object]),
  data: PropTypes.oneOfType([PropTypes.object, PropTypes.array]).isRequired,
  defaultSelectedOption: defaultSelectedOptionPropType,
  identifier: PropTypes.string.isRequired,
  isClearable: PropTypes.bool,
  isLoading: PropTypes.bool,
  isMulti: PropTypes.bool,
  keyMapping: PropTypes.oneOfType([PropTypes.object]),
  messages: PropTypes.oneOfType([PropTypes.object]),
  placeholder: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  selectedValue: PropTypes.string,
  theme: PropTypes.string.isRequired,
}

const getActualData = ({ data, reduxStateId, sortByKeys }) => {
  const actualData = get(data, reduxStateId)
  if (actualData) {
    return sortByKeys ? sortBy(actualData, sortByKeys) : actualData
  }
  return data
}

const getQueryDependencies = (formik, initialValues, dependencies) => {
  let queryDependencies = [...initialValues]
  if (formik && dependencies && isArray(dependencies)) {
    queryDependencies = [
      ...queryDependencies,
      ...values(pick(formik.values, dependencies)),
    ]
  }
  return queryDependencies
}

const groupStyles = {
  color: '#444',
  fontWeight: 'bold',
  fontSize: '15px',
  // opacity: 0.8,
  textTransform: 'none',
}
const GroupHeading = props => (
  <components.GroupHeading {...props} style={groupStyles} />
)

const AspectDropDown = ({
  props: {
    classNames,
    components = {}, // customization of layout, see 'MigratedComponents/Notifications/List/config.jsx'
    data: passedData,
    defaultSelectedOption,
    dependencies,
    endpoint,
    formik,
    hideIfNoOptions = true,
    identifier,
    isClearable,
    isMulti,
    keyMapping,
    messages,
    normalizeLoadedData,
    placeholder,
    selectedValue,
    sortByKeys,
    state: reduxStateId,
  },
  action,
  theme,
}) => {
  const [selectOptions, setSelectOptions] = useState(false)
  const {
    isError,
    data = false,
    error: queryErrorMessage,
  } = useQuery(
    reduxStateId,
    async () => (endpoint ? fetchWrapperForQueries({ endpoint }) : passedData),
    {
      initialData: passedData,
      initialStale: true,
    }
  )
  const queryDependencies = getQueryDependencies(
    formik,
    [data, selectOptions],
    dependencies
  )
  useEffect(() => {
    if (data) {
      const isLoadedFromApi =
        endpoint && // if 'endpoint' is defined - we fetch data from api
        normalizeLoadedData &&
        !isEqual(passedData, data) // loaded data should differ from initial data
      const options = isLoadedFromApi
        ? normalizeLoadedData(data, formik) || []
        : getActualData({ data, reduxStateId, sortByKeys })
      if (options && !isEqual(options, selectOptions)) {
        setSelectOptions(options)
      }
      // when `options` don't contain current value - reset field value in formik.values
      if (
        formik &&
        options.find &&
        !options.find(({ value }) => value === formik.values[identifier])
      ) {
        formik.setFieldValue(
          identifier,
          formik.initialValues[identifier],
          false
        )
        // TODO: after resetting value in formik.values - also reset input text control of the Select
      }
    }
  }, queryDependencies)

  if (isError) {
    throw new Error(queryErrorMessage)
  }

  return selectOptions && (!hideIfNoOptions || selectOptions.length > 0) ? (
    <SelectComponent
      action={action}
      classNames={classNames}
      components={{
        GroupHeading,
        ...components,
      }}
      data={selectOptions}
      defaultSelectedOption={defaultSelectedOption}
      identifier={identifier}
      isClearable={isClearable}
      isMulti={isMulti}
      keyMapping={keyMapping}
      messages={messages}
      placeholder={placeholder}
      selectedValue={selectedValue}
      theme={theme}
    />
  ) : null
}

AspectDropDown.defaultProps = {
  theme: UI_CONSTS.themeName.aspect,
}

AspectDropDown.propTypes = {
  action: PropTypes.func.isRequired,
  props: PropTypes.shape({
    classNames: PropTypes.oneOfType([PropTypes.object]),
    components: PropTypes.oneOfType([PropTypes.object]),
    data: PropTypes.oneOfType([
      PropTypes.object,
      PropTypes.array,
      PropTypes.bool,
    ]),
    defaultSelectedOption: defaultSelectedOptionPropType,
    dependencies: PropTypes.arrayOf(PropTypes.string),
    endpoint: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
    formik: PropTypes.oneOfType([PropTypes.shape, PropTypes.object]),
    hideIfNoOptions: PropTypes.bool,
    identifier: PropTypes.string.isRequired,
    isClearable: PropTypes.bool,
    isMulti: PropTypes.bool,
    keyMapping: PropTypes.shape({
      idKey: PropTypes.string,
      nameKey: PropTypes.string,
    }),
    messages: PropTypes.oneOfType([PropTypes.object]),
    normalizeLoadedData: PropTypes.func,
    placeholder: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    selectedValue: PropTypes.string,
    sortByKeys: PropTypes.oneOfType([PropTypes.array]),
    state: PropTypes.string.isRequired,
  }).isRequired,
  theme: PropTypes.string,
}

export default AspectDropDown
