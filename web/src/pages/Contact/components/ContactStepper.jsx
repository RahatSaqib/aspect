import * as React from 'react'
import { Box, Step, StepLabel, Stepper, Tab, Tabs } from '@mui/material'
import useI18n from '../../../hooks/useI18n'
import messages from '../messages'

const ContactStepper = ({ step, full, isUpdate, onChange }) => {
  const { formatMessage } = useI18n()
  const options = full
    ? ['contactDetails', 'systemAccessControl', 'jobAssignment']
    : ['accountDetails', 'systemAccessControl']

  if (isUpdate)
    return (
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: '10px' }}>
        <Tabs value={step} variant="fullWidth" onChange={onChange} aria-label="basic tabs example">
          {options.map(label => (
            <Tab key={label} label={formatMessage(messages[label])} />
          ))}
        </Tabs>
      </Box>
    )

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
