import React from 'react'
import Button from '@material-ui/core/Button'
import { useFormikContext } from 'formik'

import { MODE } from './utils'
import messages from './messages'

export const ButtonSave = ({ formatMessage, onClick, deviceId, mode }) => {
  const { formik } = useFormikContext()
  return (
    <Button
      color="primary"
      disabled={mode === MODE.SAVING || !formik.isValid}
      onClick={() => onClick(deviceId, formik.values)}
      variant="contained"
    >
      {formatMessage(messages.submit)}
    </Button>
  )
}

export default ButtonSave
