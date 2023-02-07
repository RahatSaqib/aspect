/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useCallback, useState } from 'react'
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
  onTouched,
  classNames,
  components,
  data,
  defaultSelectedOption = null, // do not allow `undefined` to be in `controlled` mode
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
  const [currentSelectedOption, setCurrentSelectedOption] = useState(null)
  const [defaultOption] = useState(selectedValue)
  const [options, setOptions] = useState([])

  useEffect(() => {
    if (
      // passed-in `data` differs from local `options`
      !isEqual(options, data) ||
      /**
       * when we change value in formik programmatically (i.e. formik.setFieldValue)
       * then this component gets new value via defaultSelectedOption
       * and we need to change currentSelectedOption to re-render component
       */
      defaultSelectedOption !== currentSelectedOption
    ) {
      setCurrentSelectedOption(getSelectedOptions(data, defaultSelectedOption, idKey))
      setOptions(data)
    }
  }, [data, defaultSelectedOption])

  const onChange = useCallback(
    (selectedOption, { action }) => {
      dispatchFromRedux({ identifier, selectedOption, action })
    },
    [identifier, dispatchFromRedux]
  )

  return (
    <div className={cssClasses('select__container', { [classNames.controlContainer]: !!classNames.controlContainer })}>
      <Select
        components={components}
        name={identifier}
        id={identifier}
        getOptionLabel={val => (val[nameKey] ? formatMessage(messages[val[nameKey]], {}, val[nameKey]) : '')}
        getOptionValue={val => val[idKey]}
        isClearable={isClearable}
        isDisabled={isDisabled}
        isLoading={isLoading}
        isMulti={isMulti}
        options={options}
        menuPlacement="auto"
        isOptionDisabled={option => option.disabled}
        placeholder={defaultOption || placeholder}
        styles={buildCustomStyles(theme)}
        onChange={onChange}
        onBlur={onTouched}
        noOptionsMessage={() => formatMessage(messagesBase.noOptionsMessage)}
        /**
         * we work in `controlled` mode, meaning that `value` must be either
         * some actual value (string or object or array) or `null`.
         * See how we set up a `currentSelectedOption`
         */
        value={currentSelectedOption}
      />
    </div>
  )
}

SelectComponent.defaultProps = {
  classNames: {},
  components: undefined,
  defaultSelectedOption: null, // do not allow `undefined` to be in `controlled` mode
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
  onTouched: PropTypes.func.isRequired,
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
    return null
  }
  if (isArray(someValue)) {
    const options = someValue.map(value => getOptionByValue(data, value, idKey))
    return options
  }

  const option = getOptionByValue(data, someValue, idKey)
  return option || null
}

const buildCustomStyles = theme => {
  if (theme === UI_CONSTS.themeName.mui) {
    return getMuiTheme()
  }

  if (theme === UI_CONSTS.themeName.aspect) {
    return getAspectTheme()
  }
}

export default React.memo(SelectComponent)
