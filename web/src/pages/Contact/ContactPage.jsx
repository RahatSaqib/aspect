import React, { lazy, Suspense, useState } from 'react'
import { Box, Card, CardContent } from '@mui/material'
import { Helmet } from 'react-helmet'
import useI18n from '../../hooks/useI18n'
import { useAuthState } from '../../providers/AuthProvider'
import { DirtyStepsProvider, FormStatusProvider } from './context'
import messages from './messages'

const ContactDetails = lazy(() => import('./ContactDetails'))
const JobAssigment = lazy(() => import('./JobAssigment'))
const Login = lazy(() => import('./Login'))

const Step = ({ step, value, children }) => <div hidden={step !== value}>{children}</div>

const ContactPage = () => {
  const { userPermissions } = useAuthState()
  const [step, setStep] = useState(0)
  const { formatMessage } = useI18n()
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
                  {userPermissions.includes('person:edit') ? (
                    <Step step={step} value={1}>
                      <JobAssigment setStep={setStep} />
                    </Step>
                  ) : null}
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
