import React from 'react'
import { createFilterOptions } from '@mui/material/Autocomplete'
import PropTypes from 'prop-types'
import useTagByType from '../../hooks/tag/useTagByType'
import AspectSelect from '../AspectSelect'

const filter = createFilterOptions()

const SiteTagInput = props => {
  const { data: possibleTags } = useTagByType('site')
  return (
    <AspectSelect
      options={possibleTags ?? []}
      itemToString={i => i?.title ?? ''}
      filterOptions={(options, params) => {
        const filtered = filter(options, params)
        const { inputValue } = params
        const isExisting = options.some(option => inputValue === option.title)
        if (inputValue !== '' && !isExisting) {
          filtered.push({
            title: inputValue,
          })
        }
        return filtered
      }}
      freeSolo
      multiple
      {...props}
    />
  )
}

SiteTagInput.propTypes = {
  value: PropTypes.oneOfType([PropTypes.array]).isRequired,
  onChange: PropTypes.func.isRequired,
}

export default SiteTagInput
