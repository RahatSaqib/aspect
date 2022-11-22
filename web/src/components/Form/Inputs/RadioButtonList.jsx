import React, { useMemo } from 'react'
import { FormControlLabel, RadioGroup, Radio } from '@mui/material'
import { useFormikContext } from 'formik'
import useI18n from '../../../hooks/useI18n'
import messages from '../messages'

const RadioButtonList = props => {
  const { controlType: { options, getOptions } = {}, label, id, name, value } = props
  const { formatMessage } = useI18n()
  const { formik, updateField, toggleEdit } = useFormikContext()

  const actualOptions = useMemo(() => {
    let items = []
    if (options) {
      items = options
    }
    if (getOptions) {
      items = getOptions(formik.values)
    }
    return items || []
  }, [getOptions, formik.values, options])

  const handleChange = event => {
    updateField(id, event.target.value, { formik, toggleEdit })
  }

  return (
    <div>
      {label}
      <div style={{ marginTop: 9 }}>
        <RadioGroup>
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
    </div>
  )
}

export default RadioButtonList
