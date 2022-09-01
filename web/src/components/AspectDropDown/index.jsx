/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import { useQuery } from 'react-query'
import Select, { components as originalComponents } from 'react-select'
import { defineMessages } from 'react-intl'
import TextField from '@mui/material/TextField'

import get from 'lodash/get'
import find from 'lodash/find'
import isArray from 'lodash/isArray'
import isEqual from 'lodash/isEqual'
import isNil from 'lodash/isNil'
import isNumber from 'lodash/isNumber'
import isPlainObject from 'lodash/isPlainObject'
import isString from 'lodash/isString'
import intersectionWith from 'lodash/intersectionWith'
import keys from 'lodash/keys'
import pick from 'lodash/pick'
import sortBy from 'lodash/sortBy'

import useI18n from '../../hooks/useI18n'
import fetchWrapperForQueries from '../QueryFetch'
import UI_CONSTS from '../../utils/consts/UI'
import IconProvider from '../IconProvider'

import styles from './Dropdown.css'

const SelectComponent = ({
  action: dispatchFromRedux,
  classNames,
  components,
  data,
  defaultSelectedOption,
  identifier,
  isClearable,
  isDisabled,
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
  const [currentSelectedOption, setCurrentSelectedOption] = useState(defaultSelectedOption)
  const [defaultOption] = useState(selectedValue)
  const [, setInputValue] = useState(false)

  const [options, setOptions] = useState(false)

  // if defaultSelectedOption is true, then the default selection is set to the first element
  defaultSelectedOption = defaultSelectedOption === true && data?.length > 0 ? data[0][idKey] : defaultSelectedOption

  useEffect(() => {
    if (
      // passed-in `data` differs from local `options`
      !isEqual(options, data) ||
      /**
       * when we change value in formik programmatically (i.e. formik.setFieldValue)
       * then this component gets new value for defaultSelectedOption and we need to
       * enforce component to re-render in this `if` block
       */
      defaultSelectedOption !== currentSelectedOption
    ) {
      setDefaultOptionValue(
        !identifier.includes('areaItems')
          ? getSelectedOptions(data, defaultSelectedOption, idKey)
          : defaultSelectedOption
      )
      setCurrentSelectedOption(defaultSelectedOption)
      setOptions(data)
      /**
       * Because we do not explicitly set `value` for Select component - then
       * to set new value on-the-fly (after changing `options`) we use prop
       * `defaultValue` when Select is first rendered.
       * So to make sure that prop `defaultValue={...}` takes effect when `options`
       * changed we need to force it to re-render by
       * 1) hiding it (busy=true) and then
       * 2) rendering it back (busy=false)
       */
      setBusy(true)
      setTimeout(() => setBusy(false))
    } else {
      setBusy(false)
    }
  }, [data, defaultSelectedOption])

  const onChange = (selectedOption, { action }) => {
    setInputValue({ selectedOption, action })
    dispatchFromRedux({ identifier, selectedOption, action })
  }

  return !busy ? (
    <div className={cssClasses('select__container', { [classNames.controlContainer]: !!classNames.controlContainer })}>
      <Select
        components={components}
        name={identifier}
        id={identifier}
        getOptionLabel={val => formatMessage(messages[val[nameKey]], {}, val[nameKey])}
        getOptionValue={val => val[idKey]}
        isClearable={isClearable}
        isDisabled={isDisabled}
        isLoading={isLoading}
        isMulti={isMulti}
        defaultValue={defaultOptionValue}
        options={data}
        isOptionDisabled={option => option.disabled}
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
  isDisabled: false,
  isLoading: false,
  isMulti: false,
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
  isDisabled: PropTypes.bool,
  isLoading: PropTypes.bool,
  isMulti: PropTypes.bool,
  keyMapping: PropTypes.oneOfType([PropTypes.object]).isRequired,
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

const replacePlaceholders = (originalString, values) => {
  let processedString = originalString
  keys(values).forEach(key => {
    processedString = processedString.replace(`{{${key}}}`, values[key])
  })
  return processedString
}
const sanitizeDependencies = (dependenciesWithPlaceholders, values) => {
  return dependenciesWithPlaceholders.map(fieldName => replacePlaceholders(fieldName, values))
}

const getQueryDependencies = (formik, initialQueryDependencies, dependenciesWithPlaceholders, subRowIndex) => {
  let queryDependencies = [...initialQueryDependencies, subRowIndex]
  if (formik && dependenciesWithPlaceholders && isArray(dependenciesWithPlaceholders)) {
    const dependencyNames = sanitizeDependencies(dependenciesWithPlaceholders, {
      subRowIndex,
    })
    const dependencyValues = dependencyNames.map(fieldName => get(formik.values, fieldName) || null)

    queryDependencies = [...queryDependencies, ...dependencyValues]
  }
  return queryDependencies
}
const getActualValue = (options, currentValue, defaultValue) => {
  if (!isArray(options)) {
    return defaultValue
  }
  if (isArray(currentValue)) {
    const actualValue = intersectionWith(options, currentValue, isEqual)
    return actualValue.length === 0 ? defaultValue : actualValue
  }
  return options.find(({ value }) => value === currentValue) ? currentValue : defaultValue
}

const groupStyles = {
  color: '#444',
  fontWeight: 'bold',
  fontSize: '15px',
  textTransform: 'none',
}
const GroupHeading = props => <originalComponents.GroupHeading {...props} style={groupStyles} />

const LabelValue = ({ selectOptions, defaultSelectedOption, keyMapping }) => {
  const options = getSelectedOptions(selectOptions, defaultSelectedOption, keyMapping.idKey)

  let text = '-'
  if (options) {
    if (isArray(options)) {
      text = options.map(({ label }) => label).join('; ')
    } else {
      text = options.label
    }
  }

  return (
    <TextField
      InputProps={{
        readOnly: true,
        disableUnderline: true,
      }}
      multiline
      value={text}
    />
  )
}

const hasIcon = options => {
  if (Array.isArray(options)) {
    return options.map(option => hasIcon(option)).some(icon => icon)
  }
  if (Object.prototype.hasOwnProperty.call(options, 'options')) {
    return hasIcon(options.options)
  }
  return Object.prototype.hasOwnProperty.call(options, 'icon')
}

const AspectDropDown = ({
  props: {
    classNames,
    components = {}, // customization of layout, see 'components/Notifications/List/config.jsx'
    data: passedData,
    defaultSelectedOption,
    dependencies,
    endpoint,
    formik,
    hideIfNoOptions = true,
    identifier,
    isClearable,
    isDisabled,
    isMulti,
    keyMapping = {
      idKey: 'id',
      nameKey: 'name',
    },
    messages,
    normalizeLoadedData,
    placeholder,
    selectedValue,
    sortByKeys,
    state: reduxStateId,
    subRowIndex,
    updateField,
    showLabelWhenDisabled = false,
  },
  action,
  theme,
}) => {
  const [selectOptions, setSelectOptions] = useState(false)
  const {
    isError,
    data: responseFromQuery = false,
    error: queryErrorMessage,
  } = useQuery(reduxStateId, async () => (endpoint ? fetchWrapperForQueries({ endpoint }) : passedData), {
    initialData: passedData,
    initialStale: true,
  })
  const queryDependencies = getQueryDependencies(formik, [responseFromQuery, selectOptions], dependencies, subRowIndex)
  useEffect(() => {
    if (responseFromQuery) {
      const isLoadedFromApi =
        endpoint && // if 'endpoint' is defined - we fetch data from api
        normalizeLoadedData &&
        !isEqual(passedData, responseFromQuery) // loaded data should differ from initial data
      const options = isLoadedFromApi
        ? normalizeLoadedData(responseFromQuery, formik, subRowIndex) || []
        : getActualData({ data: responseFromQuery, reduxStateId, sortByKeys })
      if (options && !isEqual(options, selectOptions)) {
        setSelectOptions(options)
      }
      /**
       * when `options` doesn't contain current value - update field
       * with `actualValue` which is either `initialValue` or intersection
       * between `currentValue` and `options` for multi-select control
       */
      const initialValue = get(formik?.initialValues, identifier)
      const currentValue = get(formik?.values, identifier)
      const actualValue = getActualValue(options, currentValue, initialValue)
      if (formik && currentValue !== initialValue && isArray(options) && !isEqual(currentValue, actualValue)) {
        updateField(identifier, actualValue, { formik })
      }
    }
  }, queryDependencies)

  if (isError) {
    throw new Error(queryErrorMessage)
  }

  const onChanged = eventData => {
    const actionData = pick(eventData, ['identifier', 'selectedOption', 'action'])
    const { ok, data: dataSource } = responseFromQuery
    action(actionData, ok ? dataSource : null)
  }

  const showUi = selectOptions && (!hideIfNoOptions || selectOptions.length > 0)

  if (showLabelWhenDisabled && isDisabled && showUi) {
    return (
      <LabelValue selectOptions={selectOptions} defaultSelectedOption={defaultSelectedOption} keyMapping={keyMapping} />
    )
  }

  const finalOption = hasIcon(selectOptions)
    ? {
        Option: props => {
          const { data, ...rest } = props
          return (
            <originalComponents.Option {...rest}>
              <span>
                <IconProvider icon={data.icon} />
              </span>
              <span>{data[keyMapping.nameKey]}</span>
            </originalComponents.Option>
          )
        },
      }
    : { Option: components.Option || originalComponents.Option }

  return showUi ? (
    <SelectComponent
      action={onChanged}
      classNames={classNames}
      components={{
        ...originalComponents,
        GroupHeading,
        ...components,
        ...finalOption,
      }}
      data={selectOptions}
      defaultSelectedOption={defaultSelectedOption}
      identifier={identifier}
      isClearable={isClearable}
      isDisabled={isDisabled}
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
    data: PropTypes.oneOfType([PropTypes.object, PropTypes.array, PropTypes.bool]),
    defaultSelectedOption: defaultSelectedOptionPropType,
    dependencies: PropTypes.arrayOf(PropTypes.string),
    endpoint: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
    formik: PropTypes.oneOfType([PropTypes.shape, PropTypes.object]),
    hideIfNoOptions: PropTypes.bool,
    identifier: PropTypes.string.isRequired,
    isClearable: PropTypes.bool,
    isDisabled: PropTypes.bool,
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
    subRowIndex: PropTypes.number,
    updateField: PropTypes.func,
    showLabelWhenDisabled: PropTypes.bool,
  }).isRequired,
  theme: PropTypes.string,
}

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
  '--ming': aspectPrimary,
  '--aspect-color-chill-blue-1': aspectChillBlue1,
  '--aspect-color-chill-blue-3': aspectChillBlue3,
  '--aspect-color-white': aspectWhite,
  '--white-lilac-2': lilac2,
} = process.env

function getOptionByValue(data, requestedValue, idKey) {
  // When the requested value is an object including key and value props
  if (isPlainObject(requestedValue)) {
    const { value } = requestedValue
    return find(data, { [idKey]: value })
  }

  // When the requested value is a string key
  if (isString(requestedValue)) {
    // Take the option in different ways, depending on the data format
    if (isPlainObject(data)) return find(data, { [idKey]: requestedValue })

    if (isArray(data)) {
      const simpleListFind = data.find(option => option[idKey] === requestedValue)
      // options can be nested/grouped: ie {label:'a', options:[{label:'a1',name:'a1'}]}
      const groupedListFind = data
        .flatMap(o => o.options)
        .find(option => option !== undefined && option[idKey] === requestedValue)
      return simpleListFind || groupedListFind
    }

    if (isNumber(requestedValue)) return data.find(option => option[idKey] === requestedValue)
  }

  // When the requested value is a position in the array
  if (isNumber(requestedValue)) return data[requestedValue]
}

function getSelectedOptions(data, someValue, idKey) {
  // for grouped selects, pass it through
  if (someValue && someValue[0]?.grouped) {
    return someValue
  }
  // continue and format as normal
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
export const getAspectTheme = () => {
  return {
    option: (provided, state) => {
      const { isSelected, isFocused } = state
      return {
        ...provided,
        ...styleOptionBase,
        color: isSelected ? aspectWhite : aspectChillBlue1,
        backgroundColor: (isSelected && aspectChillBlue3) || (isFocused && lilac2),
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
    multiValue: provided => ({
      ...provided,
      backgroundColor: 'transparent',
      color: aspectPrimary,
    }),
    multiValueLabel: provided => ({
      ...provided,
      color: aspectWhite,
    }),
  }
}
export const getMuiTheme = () => {
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
        transition: 'border-bottom-color 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
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

export default AspectDropDown
