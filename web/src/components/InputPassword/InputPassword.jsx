import React from 'react'
import { TextField } from '@mui/material'
import { useIntl } from 'react-intl'
import passwordComplexityMessages from '../../messages/passwordComplexityMessages'
import { getPasswordHintKey } from '../../utils/utils/passwordComplexity'

const InputPassword = ({
  id,
  name,
  label,
  value,
  onChange,
  error,
  helperText,
  disabled,
  showComplexityHint = true,
}) => {
  const { formatMessage } = useIntl()
  const hintKey = showComplexityHint ? getPasswordHintKey(value) : null
  const hint = hintKey ? formatMessage(passwordComplexityMessages[hintKey]) : null
  const displayedHelperText = !value && helperText ? helperText : hint || helperText

  return (
    <>
      <TextField
        id={id}
        name={name}
        label={label}
        value={value}
        disabled={disabled}
        autoComplete="new-password"
        onChange={onChange}
        error={error}
        helperText={displayedHelperText}
        type="password"
      />
    </>
  )
}

export default InputPassword
