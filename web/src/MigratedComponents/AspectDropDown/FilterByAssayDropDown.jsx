import React, { useEffect, useState } from 'react'
import { oneOfType, object } from 'prop-types'
import isEmpty from 'lodash/isEmpty'
import isEqual from 'lodash/isEqual'
import map from 'lodash/map'
import Select from 'react-select'
import { defineMessages } from 'react-intl'
import useI18n from '../../Hooks/i18n/useI18n'
import { getAspectTheme } from './index.jsx'
import assayTranslations from '../../shared/messages/assay.js'

const messages = defineMessages({
  selectAssay: {
    id: 'filter.clientSideFilterSelect.selectAssay',
    defaultMessage: 'Select an Assay',
  },
})

const FilterByAssayDropDown = props => {
  const { formatMessage } = useI18n()
  const {
    props: { actionComponentProps: config, action },
  } = props
  const { selectorModifiers, data } = config
  const { isClearable, isSearchable } = selectorModifiers[0] || false
  const [options, setOptions] = useState(false)

  const handleChange = (val, type) => {
    const { action: selectAction } = type
    return action({ val, selectAction })
  }

  useEffect(() => {
    if (isEmpty(options) && !isEmpty(data)) {
      const newOptions = []
      map(data, (val, key) =>
        newOptions.push({
          label: formatMessage(assayTranslations[val]),
          value: key,
        })
      )
      if (!isEqual(options, newOptions)) {
        setOptions(newOptions)
      }
    }
  }, [options, data, formatMessage])

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        marginBottom: '20px',
      }}
    >
      <div style={{ width: '250px' }}>
        <Select
          placeholder={formatMessage(messages.selectAssay)}
          className="basic-single"
          classNamePrefix="select"
          isMulti
          isLoading={!options}
          isClearable={isClearable}
          isSearchable={isSearchable}
          onChange={handleChange}
          name="color"
          options={options}
          styles={getAspectTheme()}
        />
      </div>
    </div>
  )
}

FilterByAssayDropDown.propTypes = {
  props: oneOfType([object]).isRequired,
}

export default FilterByAssayDropDown
