import React, { Fragment, useEffect, useState } from 'react'
import { oneOfType, object } from 'prop-types'
import isEmpty from 'lodash/isEmpty'
import isEqual from 'lodash/isEqual'
import map from 'lodash/map'
import groupBy from 'lodash/groupBy'
import orderBy from 'lodash/orderBy'
import findIndex from 'lodash/findIndex'
import Select, { components } from 'react-select'
import { defineMessages } from 'react-intl'
import useI18n from '../../Hooks/i18n/useI18n'
import { getAspectTheme } from './index.jsx'
import assayTranslations from '../../shared/messages/assay.js'

const messages = defineMessages({
  selectAssay: {
    id: 'filter.clientSideFilterSelect.selectAssay',
    defaultMessage: 'Select an Assay',
  },
  selectAll: {
    id: 'filter.clientSideFilterSelect.selectAll',
    defaultMessage: 'All',
  },
})

const CustomClearText = () => {
  const { formatMessage } = useI18n()
  return <Fragment>{formatMessage(messages.selectAll)}</Fragment>
}
const ClearIndicator = props => {
  const {
    children = <CustomClearText />,
    getStyles,
    innerProps: { ref, ...restInnerProps },
  } = props
  return (
    <div
      {...restInnerProps}
      ref={ref}
      style={getStyles('clearIndicator', props)}
    >
      <div style={{ padding: '0px 5px' }}>{children}</div>
    </div>
  )
}

const Group = props => {
  const { selectProps, options, headingProps } = props
  return (
    <components.Group
      {...props}
      headingProps={{
        ...headingProps,
        onClick: () =>
          selectProps.onChange(options, { action: 'select-option' }),
      }}
    />
  )
}

const FilterByAssayDropDown = props => {
  const { formatMessage } = useI18n()
  const {
    props: { actionComponentProps: config, action },
  } = props
  const { selectorModifiers, data } = config
  const {
    identifier,
    isClearable,
    isSearchable,
    initByCountryDefault = false,
    initByCountryDefaultGroup = false,
  } = selectorModifiers[0] || false
  const [defaultValue, setDefaultValue] = useState(false)
  const [options, setOptions] = useState(false)

  const handleChange = (val, type) => {
    const { action: selectAction } = type
    return action({ val, selectAction })
  }

  useEffect(() => {
    if (isEmpty(options) && !isEmpty(data)) {
      const newOptions = []
      if (initByCountryDefault) {
        const grouped = groupBy(data?.assays, 'assayTypeAbbreviation')
        map(grouped, (val, key) => {
          const tempOptions = []
          map(val, ({ i18nKey, externalId }) =>
            tempOptions.push({
              label: formatMessage(assayTranslations[i18nKey]),
              value: externalId,
              group: key,
            })
          )
          return newOptions.push({ label: key, options: tempOptions })
        })
      } else {
        map(data?.keys, (val, key) =>
          newOptions.push({
            label: formatMessage(assayTranslations[val]),
            value: key,
          })
        )
      }
      // Set default assay group
      if (!isEqual(options, newOptions)) {
        const defaultAssayGroup = orderBy(
          data?.assays,
          'resultCount',
          'desc'
        )[0]
        let defaultAssayGroupIndex = data?.assays.indexOf(defaultAssayGroup)
        // Default selected assay group to the provided one
        if (initByCountryDefaultGroup) {
          const presetDefaultGroupIndex = findIndex(
            newOptions,
            ({ label }) => label === initByCountryDefaultGroup
          )
          // If it doesn't exist in the list, then default to the group of the assay with more results
          if (presetDefaultGroupIndex > -1)
            defaultAssayGroupIndex = presetDefaultGroupIndex
        }
        setDefaultValue(newOptions[defaultAssayGroupIndex]?.options)
        handleChange(newOptions[defaultAssayGroupIndex]?.options, {
          action: 'select-option',
        })
        setOptions(newOptions)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, data, formatMessage, initByCountryDefault])

  return defaultValue ? (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        marginBottom: '20px',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '450px',
          zIndex: 99,
        }}
      >
        <Select
          autoBlur
          placeholder={formatMessage(messages.selectAssay)}
          className="basic-single"
          classNamePrefix="select"
          hideSelectedOptions={false}
          defaultValue={defaultValue}
          isMulti
          isLoading={!options && !defaultValue}
          isClearable={isClearable}
          isSearchable={isSearchable}
          onChange={handleChange}
          name={identifier}
          options={options}
          styles={getAspectTheme()}
          components={{ ClearIndicator, Group }}
        />
      </div>
    </div>
  ) : null
}

FilterByAssayDropDown.propTypes = {
  props: oneOfType([object]).isRequired,
}

export default FilterByAssayDropDown
