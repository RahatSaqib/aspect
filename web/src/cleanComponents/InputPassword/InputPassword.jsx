import React from 'react'
import { Clear } from '@mui/icons-material'
import { TextField, Stepper, Step, StepLabel } from '@mui/material'
import useI18n from '../../hooks/useI18n'
import messages from './messages'

const InputPassword = ({ id, name, label, value, onChange, error, helperText, disabled }) => {
  const { formatMessage } = useI18n()
  const rules = [
    { descriptionLabel: formatMessage(messages.eightCharsLong), validator: /^.{8,}$/ },
    { descriptionLabel: formatMessage(messages.mixCase), validator: /(?=.*?[a-z])(?=.*?[A-Z])/ },
    { descriptionLabel: formatMessage(messages.specialChar), validator: /(?=.*?[`~!@#$%^&*()\-=_+\\[\]{}/?,.<>])/ },
    { descriptionLabel: formatMessage(messages.numbersIncluded), validator: /\d/ },
  ]

  return (
    <>
      <TextField
        id={id}
        name={name}
        label={label}
        value={value}
        disabled={disabled}
        autoComplete="none"
        onChange={onChange}
        error={error}
        helperText={helperText}
        type="password"
      />
      {value.length ? (
        <Stepper activeStep={rules.length - 1} orientation="vertical" connector={<span />}>
          {rules.map(rule =>
            !rule.validator.test(value) ? (
              <Step key={rule.descriptionLabel}>
                <StepLabel StepIconComponent={() => <Clear color="error" />}>{rule.descriptionLabel}</StepLabel>
              </Step>
            ) : null
          )}
        </Stepper>
      ) : null}
    </>
  )
}

export default InputPassword
