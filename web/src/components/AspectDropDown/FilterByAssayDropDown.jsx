import React, { useEffect, useState } from 'react'
import findIndex from 'lodash/findIndex'
import groupBy from 'lodash/groupBy'
import isEmpty from 'lodash/isEmpty'
import isEqual from 'lodash/isEqual'
import map from 'lodash/map'
import orderBy from 'lodash/orderBy'
import { oneOfType, object } from 'prop-types'
import Select, { components } from 'react-select'
import useI18n from '../../hooks/useI18n'
import { assay as assayTranslations } from '../../messages'
import { getAspectTheme } from './AspectDropDown.theme'
import ClearIndicator from './ClearIndicator'
import messages from './messages'

const Group = props => {
  const { selectProps, options, headingProps } = props
  return (
    <components.Group
      {...props}
      headingProps={{
        ...headingProps,
        onClick: () => selectProps.onChange(options, { action: 'select-option' }),
      }}
    />
  )
}

const FilterByAssayDropDown = ({ props: { actionComponentProps: config, action } }) => {
  const { formatMessage } = useI18n()
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
        const defaultAssayGroup = orderBy(data?.assays, 'resultCount', 'desc')[0]
        let defaultAssayGroupIndex = findIndex(
          newOptions,
          ({ label }) => label === defaultAssayGroup.assayTypeAbbreviation
        )
        // Default selected assay group to the provided one
        if (initByCountryDefaultGroup) {
          const presetDefaultGroupIndex = findIndex(newOptions, ({ label }) => label === initByCountryDefaultGroup)
          // If it doesn't exist in the list, then default to the group of the assay with more results
          if (presetDefaultGroupIndex > -1) defaultAssayGroupIndex = presetDefaultGroupIndex
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
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
      <div style={{ position: 'relative', width: '450px', zIndex: 99 }}>
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
