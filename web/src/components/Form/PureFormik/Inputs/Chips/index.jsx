import React, { Fragment, useEffect, useState } from 'react'
import { Box, Chip, TextField } from '@mui/material'
import cloneDeep from 'lodash/cloneDeep'
import isArray from 'lodash/isArray'
import isString from 'lodash/isString'
import pullAt from 'lodash/pullAt'
import startCase from 'lodash/startCase'
import useI18n from '../../../../../hooks/useI18n'
import messages from '../../messages'

const PureChip = ({ inputProps, form }) => {
  const { formatMessage } = useI18n()
  const [tags, setValue] = useState([]) // set string
  const [helperText, setHelperText] = useState(false)
  const { id, label } = inputProps
  const { setFieldValue, values } = form

  useEffect(() => {
    const myValue = isArray(values[id]) ? values[id].map(e => (isString(e) ? e : e.title)) : values[id]?.split(',')
    setValue(myValue)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form])

  const onDelete = (_title, index) => () => {
    const newValue = cloneDeep(tags)
    pullAt(newValue, [index])
    setValue(newValue)
    setFieldValue(id, newValue.join(',')) // str
  }

  const onKeyPress = event => {
    const { key, target } = event
    if (key === 'Enter') {
      const tagValue = target.value.trim()
      event.preventDefault()

      if (tagValue.length) {
        const newVal = tags ? [...tags, tagValue] : [tagValue]

        setValue(newVal)
        setFieldValue(id, newVal.join(',')) // str
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

  return (
    <Fragment>
      {tags?.length ? (
        <Box mb={3}>
          {tags.map((tag, index) =>
            tag !== '' ? (
              <Chip
                key={tag}
                label={tag}
                onDelete={onDelete(tag, index)}
                style={{ backgroundColor: '#34717c', borderRadius: '5px', color: 'white', marginRight: '5px' }}
              />
            ) : null
          )}
        </Box>
      ) : null}
      <TextField
        fullWidth
        label={label || startCase(id)}
        onKeyPress={onKeyPress}
        onFocus={handleFocus}
        onBlur={handleFocus}
        helperText={helperText}
      />
    </Fragment>
  )
}

export default PureChip
