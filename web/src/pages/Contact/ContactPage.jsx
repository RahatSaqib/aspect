import React, { useMemo, lazy, Suspense, useState } from 'react'
import { Box, Card, CardContent } from '@mui/material'
import { Helmet } from 'react-helmet'
import { useLocation, useParams } from 'react-router-dom'
import useI18n from '../../hooks/useI18n'
import { useAuthState } from '../../providers/AuthProvider'
import ACTION from './constants'
import { DirtyStepsProvider } from './context'
import messages from './messages'

const ContactDetails = lazy(() => import('./ContactDetails'))
const JobAssigment = lazy(() => import('./JobAssigment'))
const Login = lazy(() => import('./Login'))

const Step = ({ step, value, children }) => <div hidden={step !== value}>{children}</div>

const ContactPage = () => {
  const [step, setStep] = useState(0)
  const { formatMessage } = useI18n()
  const { personId } = useParams()
  const { userId: loggedInUserId } = useAuthState()
  const { search } = useLocation()
  const isAdd = useMemo(() => new URLSearchParams(search).get('add'), [search])

  const id = isAdd
    ? ACTION.ADD
    : personId
    ? personId === loggedInUserId
      ? ACTION.SELF
      : personId !== ACTION.ADD
      ? personId
      : ACTION.ADD
    : ACTION.SELF // if no personId in URL im in account details, therefore, it's self

  return (
    <>
      <Helmet title={formatMessage(messages.title)} />
      <Box sx={{ p: 2, minWidth: '100%' }}>
        <Card>
          <DirtyStepsProvider>
            <CardContent>
              <Suspense fallback={<></>}>
                <Step step={step} value={0}>
                  <ContactDetails setStep={setStep} id={id} />
                </Step>
                <Step step={step} value={1}>
                  <JobAssigment setStep={setStep} id={id} />
                </Step>
                <Step step={step} value={2}>
                  <Login setStep={setStep} id={id} />
                </Step>
              </Suspense>
            </CardContent>
          </DirtyStepsProvider>
        </Card>
      </Box>
    </>
  )
}

export default ContactPage
