import * as React from 'react'
import { Step, StepLabel, Stepper } from '@mui/material'
import useI18n from '../../../hooks/useI18n'
import messages from '../messages'

const ContactStepper = ({ step, full }) => {
  const { formatMessage } = useI18n()
  const options = full
    ? ['contactDetails', 'systemAccessControl', 'jobAssignment']
    : ['accountDetails', 'systemAccessControl']

  return (
    <Stepper activeStep={step}>
      {options.map(label => (
        <Step key={label}>
          <StepLabel>{formatMessage(messages[label])}</StepLabel>
        </Step>
      ))}
    </Stepper>
  )
}

export default ContactStepper
