/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { TextField } from '@mui/material'
import get from 'lodash/get'
import intersectionWith from 'lodash/intersectionWith'
import isArray from 'lodash/isArray'
import isEqual from 'lodash/isEqual'
import isNil from 'lodash/isNil'
import keys from 'lodash/keys'
import pick from 'lodash/pick'
import sortBy from 'lodash/sortBy'
import PropTypes from 'prop-types'
import { useQuery } from 'react-query'
import { components as originalComponents } from 'react-select'
import UI_CONSTS from '../../utils/consts/UI'
import IconProvider from '../IconProvider'
import fetchWrapperForQueries from '../QueryFetch'
import SelectComponent, { getSelectedOptions } from './AspectDropDown.SelectComponent'

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
/**
 * Un-group options making sure that all grouped options { label, options }
 * from any level deep go to the top of the array and return plain array of
 * { label, value } items only
 */
const getFlattenOptions = opts => {
  let arr = []
  opts.forEach(option => {
    if (option.options) {
      arr = [...arr, ...getFlattenOptions(option.options)]
    } else {
      arr = [...arr, option]
    }
  })
  return arr
}
/**
 * Return value if it can be found in the `options` array on any
 * level (in case if there are grouped options)
 */
const getActualValue = (options, currentValue, defaultValue) => {
  if (!isArray(options)) {
    return defaultValue
  }
  const flatOptions = getFlattenOptions(options)
  if (isArray(currentValue)) {
    const actualValue = intersectionWith(flatOptions, currentValue, isEqual)
    return actualValue.length === 0 ? defaultValue : actualValue
  }
  return flatOptions.find(({ value }) => value === currentValue) ? currentValue : defaultValue
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
    components: componentsRaw = {}, // customization of layout
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
  const [selectOptions, setSelectOptions] = useState([])
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
    const isLoadedFromApi =
      endpoint && // if 'endpoint' is defined - we fetch data from api
      normalizeLoadedData &&
      !isEqual(passedData, responseFromQuery) // loaded data should differ from initial data

    if (responseFromQuery) {
      if (isLoadedFromApi) {
        const options = normalizeLoadedData(responseFromQuery, formik, subRowIndex) || []
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
        if (
          formik &&
          !isNil(currentValue) &&
          currentValue !== initialValue &&
          isArray(options) &&
          !isEqual(currentValue, actualValue)
        ) {
          updateField(identifier, actualValue, { formik })
        }
      } else {
        const options = getActualData({ data: passedData, reduxStateId, sortByKeys })
        if (options && !isEqual(options, selectOptions)) {
          setSelectOptions(options)
        }
      }
    }
  }, [...queryDependencies, passedData])

  if (isError) {
    throw new Error(queryErrorMessage)
  }

  const onChanged = useCallback(
    eventData => {
      const actionData = pick(eventData, ['identifier', 'selectedOption', 'action'])
      const { ok, data: dataSource } = responseFromQuery
      action(actionData, ok ? dataSource : null)
    },
    [action, responseFromQuery]
  )
  const onTouched = useCallback(() => action({ action: 'touched', identifier }), [action, identifier])

  const components = useMemo(() => {
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
      : { Option: componentsRaw.Option || originalComponents.Option }

    return {
      ...originalComponents,
      GroupHeading,
      ...componentsRaw,
      ...finalOption,
    }
  }, [selectOptions, componentsRaw])

  const showUi = selectOptions && (!hideIfNoOptions || selectOptions.length > 0)

  if (showLabelWhenDisabled && isDisabled && showUi) {
    return (
      <LabelValue selectOptions={selectOptions} defaultSelectedOption={defaultSelectedOption} keyMapping={keyMapping} />
    )
  }

  return showUi ? (
    <SelectComponent
      action={onChanged}
      classNames={classNames}
      components={components}
      data={selectOptions}
      defaultSelectedOption={defaultSelectedOption}
      identifier={identifier}
      isClearable={isClearable}
      isDisabled={isDisabled}
      isMulti={isMulti}
      keyMapping={keyMapping}
      messages={messages}
      onTouched={onTouched}
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
    defaultSelectedOption: PropTypes.oneOfType([
      PropTypes.bool,
      PropTypes.number,
      PropTypes.string,
      PropTypes.object,
      PropTypes.array,
    ]),
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

export default AspectDropDown
