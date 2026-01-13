import React from 'react'
import { createFilterOptions } from '@mui/material/Autocomplete'
import PropTypes from 'prop-types'
import useTagByType from '../../hooks/tag/useTagByType'
import AspectSelect from '../AspectSelect'

const filter = createFilterOptions()

function getFilterOptions(options, params) {
  const filtered = filter(options, params)
  const { inputValue } = params
  const isExisting = options.some(option => inputValue === option.title)
  if (inputValue !== '' && !isExisting)
    filtered.push({
      id: inputValue,
      title: inputValue,
    })

  return filtered
}

const TagInput = props => {
  const { data: possibleTags } = useTagByType(props.type)
  return (
    <AspectSelect
      options={possibleTags ?? []}
      itemToString={i => i?.title ?? ''}
      filterOptions={getFilterOptions}
      freeSolo
      multiple
      isOptionEqualToValue={(option, value) => option.id === value.id}
      autoHighlight
      filterSelectedOptions
      disabled={false}
      {...props}
    />
  )
}

TagInput.propTypes = {
  value: PropTypes.oneOfType([PropTypes.array]).isRequired,
  onChange: PropTypes.func.isRequired,
  type: PropTypes.string.isRequired,
}

export default TagInput
