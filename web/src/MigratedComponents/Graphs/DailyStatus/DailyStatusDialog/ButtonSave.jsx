import React from 'react'
import PropTypes from 'prop-types'
import Button from '@mui/material/Button'
import { useFormikContext } from 'formik'

import useI18n from '../../../../Hooks/i18n/useI18n'
import { MODE } from './utils'
import messages from './messages'

export const ButtonSave = ({ onClick, deviceId, mode }) => {
  const { formatMessage } = useI18n()
  const { formik } = useFormikContext()
  return (
    <Button
      color="primary"
      disabled={mode === MODE.SAVING || !formik.isValid}
      onClick={() => {
        onClick(deviceId, formik.values)
        formik.resetForm()
      }}
      variant="contained"
    >
      {formatMessage(messages.submit)}
    </Button>
  )
}

ButtonSave.defaultProps = {
  deviceId: 0,
}

ButtonSave.propTypes = {
  onClick: PropTypes.func.isRequired,
  deviceId: PropTypes.number,
  mode: PropTypes.string.isRequired,
}

export default ButtonSave
