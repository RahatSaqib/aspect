import React, { useEffect, useMemo } from 'react'
import { FormControlLabel, FormHelperText, RadioGroup, Radio } from '@mui/material'
import classNames from 'classnames/bind'
import { useFormikContext } from 'formik'
import isNil from 'lodash/isNil'
import useI18n from '../../../hooks/useI18n'
import { getFieldErrorProps } from '../Formik/Helpers'
import messages from '../messages'
import styles from './RadioButtonList.css'

const classes = classNames.bind(styles)

const RadioButtonList = props => {
  const {
    controlType: {
      options,
      getOptions,
      // aligning radio's vertically (='column') or horizontally (='row')
      direction = 'column',
      autoSelectFirstOption,
    } = {},
    label,
    id,
    name,
    value,
  } = props
  const { formatMessage } = useI18n()
  const { formik, updateField, toggleEdit } = useFormikContext()
  const { error, helperText } = getFieldErrorProps(formik, id)

  // ----------------------------------------------
  const actualOptions = useMemo(() => {
    let items
    if (options) {
      items = options
    } else if (getOptions) {
      items = getOptions(formik.values)
    }
    return items || []
  }, [getOptions, formik.values, options])

  // ----------------------------------------------
  useEffect(() => {
    if (!isNil(value) && !actualOptions.find(x => x.value === value)) {
      let newValue
      if (autoSelectFirstOption) {
        newValue = actualOptions[0]?.value
      }
      updateField(id, newValue, { formik, toggleEdit })
    }
  }, [actualOptions, autoSelectFirstOption, formik, id, toggleEdit, updateField, value])

  // ----------------------------------------------
  const handleChange = event => {
    updateField(id, event.target.value, { formik, toggleEdit })
  }

  return (
    <div>
      {label}
      <div style={{ marginTop: 9 }}>
        <RadioGroup
          className={classes('Radio-Group')}
          name={id}
          // not-nice way to set boolean prop `row`
          {...(direction === 'row' ? { row: true } : {})}
        >
          {actualOptions.map(it => {
            return (
              <FormControlLabel
                control={<Radio name={name} onChange={handleChange} checked={value === it.value} />}
                key={it.value}
                label={formatMessage(messages[it.i18n])}
                value={it.value}
              />
            )
          })}
        </RadioGroup>
      </div>
      {error && helperText ? <FormHelperText error>{helperText}</FormHelperText> : null}
    </div>
  )
}

export default RadioButtonList
