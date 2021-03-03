import React from 'react'
import TextField from '@material-ui/core/TextField'
import omit from 'lodash/omit'
import omitBy from 'lodash/omitBy'
import isNil from 'lodash/isNil'

const AspectTextArea = props => {
  const { controlType: { rowsMax, rows } = {} } = props
  const mergedProps = {
    ...omit(props, ['controlType']),
    ...omitBy({ rowsMax, rows }, v => isNil(v)),
  }
  return <TextField {...mergedProps} multiline />
}

export default AspectTextArea
