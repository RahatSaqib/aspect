import React from 'react'
import { Clear } from '@mui/icons-material'
import { TextField, Stepper, Step, StepLabel } from '@mui/material'
import { useIntl } from 'react-intl'
import messages from '../../messages/allMessages'

const InputPassword = ({ id, name, label, value, onChange, error, helperText, disabled }) => {
  const { formatMessage } = useIntl()
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
        autoComplete="new-password"
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
