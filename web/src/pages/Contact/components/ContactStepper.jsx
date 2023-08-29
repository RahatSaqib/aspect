import * as React from 'react'
import { useContext } from 'react'
import { Box, Step, StepLabel, Stepper, Tab, Tabs } from '@mui/material'
import usePermissions from '../../../hooks/person/usePermissions'
import useI18n from '../../../hooks/useI18n'
import { DirtyStepsContext, FormStatusContext } from '../context'
import messages from '../messages'

const ContactStepper = ({ step, full, isUpdate, onChange }) => {
  const { formatMessage } = useI18n()
  const { dirtySteps } = useContext(DirtyStepsContext)
  const { isRecentlyAdd } = useContext(FormStatusContext)
  const { checkPermission } = usePermissions()

  const options = (
    full
      ? [
          { step: 0, title: 'contactDetails' },
          { step: 1, title: 'jobAssignment', permissions: ['person:edit', 'admin', 'person:admin'] },
          { step: 2, title: 'systemAccessControl' },
        ]
      : [
          { step: 0, title: 'accountDetails' },
          { step: 2, title: 'systemAccessControl' },
        ]
  ).filter(o => (o?.permissions ? checkPermission(o?.permissions) : true))

  if (isUpdate && !isRecentlyAdd)
    return (
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: '10px' }}>
        <Tabs value={step} variant="fullWidth" onChange={onChange} aria-label="basic tabs example">
          {options.map(item => (
            <Tab
              key={item.step}
              value={item.step}
              label={`${formatMessage(messages[item.title])}${
                dirtySteps?.[item.step] ? ` (${formatMessage(messages.pendingChanges)})` : ''
              }`}
            />
          ))}
        </Tabs>
      </Box>
    )

  return (
    <Stepper activeStep={step}>
      {options.map(label => (
        <Step key={label}>
          <StepLabel>{formatMessage(messages[label.title])}</StepLabel>
        </Step>
      ))}
    </Stepper>
  )
}

export default ContactStepper
