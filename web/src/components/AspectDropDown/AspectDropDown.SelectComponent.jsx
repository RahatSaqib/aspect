/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react'
import classnames from 'classnames/bind'
import find from 'lodash/find'
import isArray from 'lodash/isArray'
import isEqual from 'lodash/isEqual'
import isNil from 'lodash/isNil'
import isNumber from 'lodash/isNumber'
import isPlainObject from 'lodash/isPlainObject'
import isString from 'lodash/isString'
import PropTypes from 'prop-types'
import { defineMessages } from 'react-intl'
import Select from 'react-select'
import useI18n from '../../hooks/useI18n'
import UI_CONSTS from '../../utils/consts/UI'
import { getMuiTheme, getAspectTheme } from './AspectDropDown.theme'
import styles from './Dropdown.css'

const cssClasses = classnames.bind(styles)

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
        menuPlacement="auto"
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
  defaultSelectedOption: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.number,
    PropTypes.string,
    PropTypes.object,
    PropTypes.array,
  ]),
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

const messagesBase = defineMessages({
  noOptionsMessage: {
    id: 'base.noOptionsMessage',
    defaultMessage: 'No options',
  },
})

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

export function getSelectedOptions(data, someValue, idKey) {
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

const buildCustomStyles = theme => {
  if (theme === UI_CONSTS.themeName.mui) {
    return getMuiTheme()
  }

  if (theme === UI_CONSTS.themeName.aspect) {
    return getAspectTheme()
  }
}

export default SelectComponent
