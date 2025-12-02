import React, { lazy, Suspense, useState } from 'react'
import { Box, Card, CardContent } from '@mui/material'
import { Helmet } from 'react-helmet'
import { useIntl } from 'react-intl'
import PermissionChecker from '../../components/PermissionChecker'
import { DirtyStepsProvider, FormStatusProvider } from './context'
import messages from './messages'

const ContactDetails = lazy(() => import('./ContactDetails'))
const JobAssignment = lazy(() => import('./JobAssignment'))
const Login = lazy(() => import('./Login'))

const Step = ({ step, value, children }) => <div hidden={step !== value}>{children}</div>

const ContactPage = () => {
  const [step, setStep] = useState(0)
  const { formatMessage } = useIntl()
  return (
    <>
      <Helmet title={formatMessage(messages.title)} />
      <Box sx={{ p: 2, minWidth: '100%' }}>
        <Card>
          <FormStatusProvider>
            <DirtyStepsProvider>
              <CardContent>
                <Suspense fallback={<></>}>
                  <Step step={step} value={0}>
                    <ContactDetails setStep={setStep} />
                  </Step>
                  <PermissionChecker permissions={['person:edit', 'admin', 'person:admin']}>
                    <Step step={step} value={1}>
                      <JobAssignment setStep={setStep} />
                    </Step>
                  </PermissionChecker>
                  <Step step={step} value={2}>
                    <Login setStep={setStep} />
                  </Step>
                </Suspense>
              </CardContent>
            </DirtyStepsProvider>
          </FormStatusProvider>
        </Card>
      </Box>
    </>
  )
}

export default ContactPage
