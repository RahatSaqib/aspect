import React, { useState, useEffect, useMemo, useRef, useCallback, createRef } from 'react'
import { FormControl, MenuItem, MenuList, Paper, Popper, TextField } from '@mui/material'
import { withStyles } from '@mui/styles'
import classNames from 'classnames'
import Downshift from 'downshift'
import filter from 'lodash/filter'
import _fp from 'lodash/fp'
import isFunction from 'lodash/isFunction'
import isNil from 'lodash/isNil'
import map from 'lodash/map'
import noop from 'lodash/noop'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import { formatWithLocale } from '../../../utils/utils/dateFormat'
import AspectButton from '../AspectButton'
import messages from './messages'
import {
  since,
  until,
  accessOptions,
  normalizeDate,
  getYearList,
  getMonthList,
  getDateList,
  getHourList,
  getMinuteList,
  getDateObject,
} from './utils/date'

const OPTION_HEIGHT = 24

const styles = theme => ({
  input: {
    flexGrow: 1,
    paddingRight: 0,
    width: '100%',
    textAlign: 'center',
    textAlignLast: 'center',
  },
  selectRoot: {
    minWidth: 'auto',
    flexGrow: 1,
    position: 'relative',
  },
  selectControl: {
    display: 'flex',
    flexFlow: 'row nowrap',
    // margin: '0 0 8px 0',
  },
  separator: {
    display: 'flex',
    alignItems: 'center',
    margin: `0 ${theme.spacing(1)}`,
  },
  formControl: {
    width: '100%',
    margin: `${theme.spacing(1)} 0`,
  },
  popper: {
    zIndex: theme.zIndex.tooltip,
  },
  paper: {
    margin: theme.spacing(1),
  },
  options: {
    maxHeight: `calc((${OPTION_HEIGHT}px + ${theme.spacing(1)}) * 5.75)`,
    overflowY: 'scroll',
  },
  option: {
    minWidth: 'auto',
  },
  button: {
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(1),
    alignSelf: 'flex-start',
  },
})

const displayKeys = ['y', 'M', 'd', 'H', 'm']

// for compatibility with old date-fns format
const dateTimeKeyMap = {
  // year
  y: displayKeys[0],
  Y: displayKeys[0],

  // month
  M: displayKeys[1],

  // date
  d: displayKeys[2],
  D: displayKeys[2],

  // hours
  h: displayKeys[3],
  H: displayKeys[3],

  // minutes
  m: displayKeys[4],
}

const dateTimeReverseKeyMap = {
  [displayKeys[0]]: ['y', 'Y'],
  [displayKeys[1]]: ['M'],
  [displayKeys[2]]: ['d', 'D'],
  [displayKeys[3]]: ['h', 'H'],
  [displayKeys[4]]: ['m'],
}

const displayOptions = culture => {
  const dateFnFormat = formatWithLocale(culture)

  return {
    [displayKeys[0]]: {
      set: accessOptions.setYear,
      get: accessOptions.getYear,
      options: ({ minDate, maxDate, formatToken = 'yyyy' }) => {
        const yearList = getYearList({ minDate, maxDate })
        return map(yearList, v => ({
          value: v,
          label: dateFnFormat(new Date(v, 0, 1), formatToken),
        }))
      },
    },
    [displayKeys[1]]: {
      set: accessOptions.setMonth,
      get: accessOptions.getMonth,
      options: ({ date, minDate, maxDate, formatToken = 'MM' }) => {
        const monthList = getMonthList({ date, minDate, maxDate })
        return map(monthList, v => ({
          value: v,
          label: dateFnFormat(new Date(1970, v, 1), formatToken),
        }))
      },
    },
    [displayKeys[2]]: {
      set: accessOptions.setDate,
      get: accessOptions.getDate,
      options: ({ date, minDate, maxDate, formatToken = 'dd' }) => {
        const dateList = getDateList({ date, minDate, maxDate })
        return map(dateList, v => ({
          value: v,
          label: dateFnFormat(new Date(1970, 0, v), formatToken),
        }))
      },
    },
    [displayKeys[3]]: {
      set: accessOptions.setHours,
      get: accessOptions.getHours,
      options: ({ date, minDate, maxDate, formatToken = 'HH' }) => {
        const hourList = getHourList({ date, minDate, maxDate })
        return map(hourList, v => ({
          value: v,
          label: dateFnFormat(new Date(1970, 0, 1, v, 0), formatToken),
        }))
      },
    },
    [displayKeys[4]]: {
      set: accessOptions.setMinutes,
      get: accessOptions.getMinutes,
      options: ({ date, minDate, maxDate, formatToken = 'mm' }) => {
        const minuteList = getMinuteList({ date, minDate, maxDate })
        return map(minuteList, v => ({
          value: v,
          label: dateFnFormat(new Date(1970, 0, 1, 0, v), formatToken),
        }))
      },
    },
  }
}

const DEFAULT_FIELDS_PROPS = {
  [displayKeys[0]]: {
    name: 'Year',
    placeholder: 'Year',
    InputProps: {},
  },
  [displayKeys[1]]: {
    name: 'Month',
    placeholder: 'Month',
    InputProps: {},
  },
  [displayKeys[2]]: {
    name: 'Date',
    placeholder: 'Date',
    InputProps: {},
  },
  [displayKeys[3]]: {
    name: 'Hours',
    placeholder: 'Hours',
    InputProps: {},
  },
  [displayKeys[4]]: {
    name: 'Minutes',
    placeholder: 'min.',
    InputProps: {},
  },
}

const getDefaultFieldsPropsWithI18n = formatMessage =>
  _fp.merge(DEFAULT_FIELDS_PROPS, {
    [displayKeys[0]]: {
      placeholder: formatMessage(messages.yearPlaceholder),
    },
    [displayKeys[1]]: {
      placeholder: formatMessage(messages.monthPlaceholder),
    },
    [displayKeys[2]]: {
      placeholder: formatMessage(messages.datePlaceholder),
    },
    [displayKeys[3]]: {
      placeholder: formatMessage(messages.hoursPlaceholder),
    },
    [displayKeys[4]]: {
      placeholder: formatMessage(messages.minutesPlaceholder),
    },
  })

const getDefaultFieldsProps = formatMessage => {
  if (isFunction(formatMessage)) {
    return getDefaultFieldsPropsWithI18n(formatMessage)
  }
  return DEFAULT_FIELDS_PROPS
}

const uniqLastRepeatStr = _fp.reduce((strs, c) => {
  if (strs.slice(-1) === c) return strs
  return strs + c
}, '')

const pruneFormat = str => {
  let prunedStr = str
  const keys = Object.keys(dateTimeKeyMap)
  const firstChar = str.charAt(0)
  const lastChar = str.slice(-1)
  if (firstChar && !keys.includes(firstChar)) {
    prunedStr = prunedStr.slice(1)
  }
  if (lastChar && !keys.includes(lastChar)) {
    prunedStr = prunedStr.slice(0, -1)
  }
  return prunedStr
}

const cleanFormat = str => {
  const keys = Object.keys(dateTimeKeyMap)
  return filter(str, c => keys.includes(c)).join('')
}

const normalizeFormat = _fp.pipe(uniqLastRepeatStr, _fp.join(''), pruneFormat)

const normalizeDateFormat = normalizeFormat

const normalizeTimeFormat = _fp.pipe(_fp.replace(/s/g, ''), normalizeFormat)

const getDateTimeFormat = ({ dateFormat = '', timeFormat = '' }) => dateFormat + timeFormat

const getDisplayFormat = ({ dateFormat, timeFormat }) => {
  let displayFormat = ''
  const normalizedDateFormat = normalizeDateFormat(dateFormat)
  const normalizedTimeFormat = normalizeTimeFormat(timeFormat)

  if (dateFormat && timeFormat) {
    displayFormat = `${normalizedDateFormat} ${normalizedTimeFormat}`
  } else if (dateFormat) {
    displayFormat = normalizedDateFormat
  } else if (timeFormat) {
    displayFormat = normalizedTimeFormat
  } else {
    displayFormat = 'y/M/d'
  }

  return normalizeFormat(displayFormat)
}

const getTokenFromDateTimeFormat = (formatStr, displayChar) =>
  _fp.pipe(
    cleanFormat,
    _fp.filter(c => _fp.toArray(dateTimeReverseKeyMap[displayChar]).includes(c)),
    _fp.join('')
  )(formatStr)

const getOrderList = _fp.pipe(
  normalizeFormat,
  _fp.uniq,
  _fp.filter(c => Object.keys(dateTimeKeyMap).includes(c))
)

const normalizeText = _fp.pipe(_fp.trim, _fp.deburr, _fp.toLower)

const findOptionByValue = (value, options) => options.find(option => option.value === value)

const findOptionByLabel = (label, options) =>
  options.find(option => normalizeText(option.label) === normalizeText(label))

const getSuggestionOptions = (value, options) => {
  const inputValue = normalizeText(value || '')
  const inputLength = inputValue.length

  if (inputLength === 0) {
    return options
  }

  const suggestions = options.filter(option => normalizeText(option.label.slice(0, inputLength)) === inputValue)

  return suggestions.length > 0 ? suggestions : options
}

const useSelectRefs = displayFormat => {
  const orderList = getOrderList(displayFormat)
  const refs = useRef(orderList.reduce((acc, orderKey) => ({ ...acc, [orderKey]: createRef() }), {}))
  return refs
}

const Option = props => {
  const { classesMap, index, itemProps, highlightedIndex, option } = props
  const isHighlighted = highlightedIndex === index

  return (
    <MenuItem {...itemProps} key={option.value} className={classesMap.option} selected={isHighlighted} component="div">
      {option.label}
    </MenuItem>
  )
}

const Options = props => {
  const { suggestions, classesMap, downshiftProps } = props
  const { getItemProps, highlightedIndex, selectedItem, setHighlightedIndex, inputValue } = downshiftProps

  useEffect(
    () => {
      setHighlightedIndex(0)
    },
    [inputValue] // eslint-disable-line react-hooks/exhaustive-deps
  )

  return (
    <MenuList>
      {suggestions.map((option, index) => (
        <Option
          key={option.value}
          index={index}
          option={option}
          itemProps={getItemProps({ item: option })}
          highlightedIndex={highlightedIndex}
          selectedItem={selectedItem}
          classesMap={classesMap}
        />
      ))}
    </MenuList>
  )
}

const DateTimeSelect = props => {
  const {
    classesMap,
    displayOption,
    baseKey,
    minDate,
    maxDate,
    optionsDate,
    value,
    handleChange,
    handleKeyPress,
    methodRef,
    formatToken,
    inputRef,
    TextFieldProps,
  } = props

  const { options: getOptions, get: fieldGetter } = displayOption

  const options = getOptions({
    minDate,
    maxDate,
    formatToken,
    date: optionsDate,
  })
  const currentOption = findOptionByValue(fieldGetter(value), options)
  const initialInputValue = currentOption ? currentOption.label : ''
  const initialSelectedItem = currentOption || null

  const handleSelect = selectedItem => {
    // selectedItem is 'undefined' when user pressed Esc
    if (selectedItem) {
      handleChange(selectedItem)
    }
  }

  if (!methodRef.current) {
    methodRef.current = {}
  }

  return (
    <Downshift
      itemToString={item => (item ? item.label : '')}
      defaultHighlightedIndex={0}
      onSelect={handleSelect}
      initialInputValue={initialInputValue}
      initialSelectedItem={initialSelectedItem}
    >
      {downshiftProps => {
        const { getInputProps, getMenuProps, inputValue, isOpen, selectItem, setState } = downshiftProps
        const growId = `${baseKey}-grow`
        const suggestions = getSuggestionOptions(inputValue, options)
        const { InputProps: baseInputProps, ...restTextFieldProps } = TextFieldProps

        const handleBlur = () => {
          const optionFromInput = findOptionByLabel(inputValue, options)
          const bluredSelectedItem = optionFromInput || currentOption
          if (bluredSelectedItem) {
            selectItem(bluredSelectedItem)
          }
        }

        const handleTextFieldFocus = () => {
          setState({ isOpen: true })
        }

        const setValueByDate = date => {
          const option = findOptionByValue(fieldGetter(date), options)
          if (option) {
            selectItem(option)
          }
        }

        methodRef.current.handleBlur = handleBlur
        methodRef.current.setValueByDate = setValueByDate
        methodRef.current.downshiftProps = downshiftProps

        return (
          <div
            name={TextFieldProps.name}
            role="presentation"
            className={classesMap.selectRoot}
            onKeyPress={handleKeyPress}
          >
            <FormControl className={classesMap.formControl}>
              <TextField
                {...restTextFieldProps}
                aria-owns={isOpen ? growId : undefined}
                aria-haspopup="true"
                InputProps={getInputProps({
                  ...baseInputProps,
                  inputRef,
                  className: classNames(classesMap.input, baseInputProps.className),
                  value: inputValue,
                  onFocus: handleTextFieldFocus,
                  onBlur: handleBlur,
                })}
              />
              <Popper open={isOpen} className={classesMap.popper} anchorEl={inputRef.current}>
                {({ TransitionProps, placement }) => (
                  <div
                    {...TransitionProps}
                    {...(isOpen ? getMenuProps({}, { suppressRefError: true }) : {})}
                    className={classesMap.options}
                  >
                    <Paper
                      square
                      className={classesMap.paper}
                      style={{
                        transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom',
                      }}
                    >
                      <Options classesMap={classesMap} suggestions={suggestions} downshiftProps={downshiftProps} />
                    </Paper>
                  </div>
                )}
              </Popper>
            </FormControl>
          </div>
        )
      }}
    </Downshift>
  )
}

const DateTimeInput = props => {
  const {
    className,
    onChange,
    onBlur,
    value: valueRaw = null,
    defaultValue,
    dateFormat,
    timeFormat,
    defaultToNow,
    showNowButton,
    buttonLabel,
    disabled,
    classes: classesMap,
    FieldProps: originFieldProps,
    RootProps,
    minDate: min,
    maxDate: max,
    ...restPropsToTextFields
  } = props

  /**
   * make sure that passed-in 'props.value' is a valid Date, i.e. parse it from string, if any.
   * In case when 'props.value' is not 'undefined' nor 'null' AND is not a valid Date - then
   * we reset it and use 'const value = undefined', i.e. getDateObject returns 'undefined'
   */
  const value = useMemo(() => (isNil(valueRaw) ? valueRaw : getDateObject(valueRaw)), [valueRaw])

  const dateTimeFormat = getDateTimeFormat({ dateFormat, timeFormat })
  const displayFormat = getDisplayFormat({ dateFormat, timeFormat })
  const { formatMessage, culture } = useIntl()
  const FieldProps = originFieldProps || getDefaultFieldsProps(formatMessage)
  const TextFieldsProps = _fp.merge(getDefaultFieldsProps(formatMessage), FieldProps)
  const minDate = getDateObject(min)
  const maxDate = getDateObject(max)
  const orderList = getOrderList(displayFormat)
  const isControlled = useCallback(() => !(value === undefined), [value])
  const initialValue = isControlled() ? value : normalizeDate({ minDate, maxDate, date: defaultValue })

  // hooks
  const [dateTime, setDateTime] = useState(initialValue)
  const [optionsDate, setOptionsDate] = useState(initialValue || new Date())
  const [isBlured, setIsBlured] = useState(false)
  const selectRefs = useSelectRefs(displayFormat)
  const methodRefs = useSelectRefs(displayFormat)
  const [stringDate, setStringDate] = useState(['2018', '01', '01'])

  useEffect(
    () => {
      if (isControlled()) {
        setDateTime(value)
        setOptionsDate(value || new Date())
      }
      if (isBlured) {
        onBlur(value)
        setIsBlured(false)
      }
    },
    [value] // eslint-disable-line react-hooks/exhaustive-deps
  )

  useEffect(() => {
    if (defaultToNow) {
      setNow()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // methods
  const getValue = () => (isControlled() ? value : dateTime)

  const focusNextField = nextFieldKey => () => {
    const nextSelectRef = selectRefs.current[nextFieldKey]
    if (nextSelectRef) {
      nextSelectRef.current.focus()
    }
  }

  const handleChange = set => val => {
    const { value: nextValue, label } = val
    const changedDate = set(optionsDate, nextValue)
    setOptionsDate(changedDate)
    setDateTime(changedDate)

    const [year, month, day] = stringDate
    if (set.toString() === accessOptions.setDate.toString()) setStringDate([year, month, label])
    else if (set.toString() === accessOptions.setMonth.toString()) setStringDate([year, label, day])
    else if (set.toString() === accessOptions.setYear.toString()) setStringDate([label, month, day])

    if (isControlled()) {
      onChange(changedDate, `${stringDate[0]}-${stringDate[1]}-${stringDate[2]}T00:00:00Z`)
    }
  }

  const handleKeyPress = nextFieldKey => event => {
    if (event.key === 'Enter') {
      event.preventDefault()
      focusNextField(nextFieldKey)()
    }
  }

  const invokeAll =
    (refs, handlerName) =>
    (...args) =>
      _fp.pipe(
        _fp.values,
        _fp.filter(ref => ref && ref.current && isFunction(ref.current[handlerName])),
        _fp.map(ref => ref.current[handlerName](...args))
      )(refs)

  const handleBlur = event => {
    const { currentTarget } = event
    setTimeout(() => {
      if (!currentTarget.contains(document.activeElement)) {
        invokeAll(methodRefs.current, 'handleBlur')()
        setIsBlured(true)
      }
    }, 0)
  }

  function setNow() {
    const now = new Date()
    setOptionsDate(now)
    setDateTime(now)
    invokeAll(methodRefs.current, 'setValueByDate')(now)

    if (isControlled()) {
      onChange(now)
    }
  }

  return (
    <div {...RootProps} className={classNames(className, classesMap.selectControl)} onBlur={handleBlur}>
      {map(normalizeFormat(displayFormat), (display, i) => {
        const baseKey = `${display}-${i}`
        const displayOption = displayOptions(culture)[dateTimeKeyMap[display]]

        if (displayOption) {
          const TextFieldProps = TextFieldsProps[display]
          const formatToken = getTokenFromDateTimeFormat(dateTimeFormat, dateTimeKeyMap[display])
          const currentOrderIdx = orderList.findIndex(order => order === display)
          const nextFieldKey = orderList[currentOrderIdx + 1]
          return (
            <DateTimeSelect
              key={`${baseKey}-DateTimeSelect`}
              classesMap={classesMap}
              displayOption={displayOption}
              value={getValue()}
              optionsDate={optionsDate}
              minDate={minDate}
              maxDate={maxDate}
              handleChange={handleChange(displayOption.set)}
              handleKeyPress={handleKeyPress(nextFieldKey)}
              methodRef={methodRefs.current[display]}
              baseKey={baseKey}
              formatToken={formatToken}
              inputRef={selectRefs.current[display]}
              TextFieldProps={_fp.merge(TextFieldProps, {
                ...restPropsToTextFields,
                disabled,
              })}
            />
          )
        }
        return (
          <div className={classesMap.separator} key={`${baseKey}-separator`}>
            <div>{display}</div>
          </div>
        )
      })}
      {showNowButton && (
        <AspectButton
          color="primary"
          variant="contained"
          className={classesMap.button}
          disabled={disabled}
          onClick={setNow}
        >
          {buttonLabel || (isFunction(formatMessage) && formatMessage(messages.nowButton)) || 'Now'}
        </AspectButton>
      )}
    </div>
  )
}

const DateType = PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)])

DateTimeInput.propTypes = {
  classes: PropTypes.object.isRequired,
  className: PropTypes.string,
  dateFormat: PropTypes.string,
  timeFormat: PropTypes.string, // eslint-disable-line react/require-default-props
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  value: PropTypes.oneOfType([PropTypes.object, PropTypes.string]), // eslint-disable-line react/require-default-props
  defaultValue: DateType,
  minDate: DateType,
  maxDate: DateType,
  defaultToNow: PropTypes.bool,
  showNowButton: PropTypes.bool,
  buttonLabel: PropTypes.string, // eslint-disable-line react/require-default-props
  disabled: PropTypes.bool,
  // eslint-disable-next-line react/require-default-props
  FieldProps: PropTypes.shape({
    y: TextField.propTypes,
    M: TextField.propTypes,
    d: TextField.propTypes,
    H: TextField.propTypes,
    m: TextField.propTypes,
  }),
  RootProps: PropTypes.object,
}

DateTimeInput.defaultProps = {
  className: '',
  dateFormat: 'yyyy/MM/dd',
  onChange: noop,
  onBlur: noop,
  defaultValue: since,
  minDate: since,
  maxDate: until,
  defaultToNow: false,
  showNowButton: false,
  disabled: false,
  RootProps: {},
}

export default withStyles(styles)(DateTimeInput)
