import React from 'react'
import TextField from '@material-ui/core/TextField'

import isNil from 'lodash/isNil'
import omitBy from 'lodash/omitBy'

import { getFieldErrorProps } from '../Formik/Helpers'
import { useFormikState } from '../Formik/Context'

const AspectTextArea = props => {
  const { updateField } = useFormikState()
  const { formik, controlType: { rowsMax, rows } = {}, ...rest } = props

  const mergedProps = {
    ...rest,
    ...omitBy({ maxRows: rowsMax, minRows: rows }, v => isNil(v)),
  }

  const onChangeLocal = event => {
    updateField(rest.id, event.target.value, formik)
  }

  return (
    <TextField
      {...mergedProps}
      multiline
      onChange={onChangeLocal}
      {...getFieldErrorProps(formik, rest.id)}
    />
  )
}

export default AspectTextArea
