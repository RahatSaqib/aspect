import React from 'react'
import TextField from '@material-ui/core/TextField'
import isNil from 'lodash/isNil'
import omitBy from 'lodash/omitBy'
import { useFormikContext } from 'formik'

import { getFieldErrorProps } from '../Formik/Helpers'

const AspectTextArea = props => {
  const { updateField } = useFormikContext()
  const {
    formik,
    controlType: { rowsMax, rows } = {},
    /**
     * below props are not used - need then to free `rest`
     */
    classNames,
    validate,
    link,
    ...rest
  } = props

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
