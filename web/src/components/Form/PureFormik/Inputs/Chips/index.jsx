import React, { Fragment, useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import TextField from '@mui/material/TextField'
import cloneDeep from 'lodash/cloneDeep'
import isEqual from 'lodash/isEqual'
import map from 'lodash/map'
import pullAt from 'lodash/pullAt'
import startCase from 'lodash/startCase'
import useI18n from '../../../../../hooks/useI18n'
import messages from '../../messages'

const PureChip = props => {
  const { formatMessage } = useI18n()
  const { inputProps, form } = props
  const { id, label } = inputProps
  const { setFieldValue, values } = form
  const [helperText, setHelperText] = useState(false)
  const [tags, setValue] = useState(values[id] || [])

  const onDelete = (_title, index) => () => {
    const newValue = cloneDeep(tags)
    pullAt(newValue, [index])
    setValue(newValue)
  }

  const handleEnter = event => {
    const { key, target } = event
    const tagValue = target.value.trim()
    if (key === 'Enter') {
      event.preventDefault()
      if (tagValue.length) {
        setValue(current => [...current, tagValue])
      }
      target.value = ''
    }
  }

  const handleFocus = () => {
    if (!helperText) {
      setHelperText(formatMessage(messages.createTags))
    } else {
      setHelperText(false)
    }
  }

  useEffect(() => {
    if (!isEqual(tags, form.values[id])) {
      setFieldValue(id, tags.join(', '))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tags])

  return (
    <Fragment>
      {tags?.length ? (
        <Box mb={3}>
          {map(tags, (tag, index) => (
            <Chip
              key={tag}
              label={tag}
              onDelete={onDelete(tag, index)}
              style={{
                backgroundColor: '#34717c',
                borderRadius: '5px',
                color: 'white',
                marginRight: '5px',
              }}
            />
          ))}
        </Box>
      ) : null}
      <TextField
        fullWidth
        label={label || startCase(id)}
        onKeyPress={handleEnter}
        onFocus={handleFocus}
        onBlur={handleFocus}
        helperText={helperText}
      />
    </Fragment>
  )
}

export default PureChip
