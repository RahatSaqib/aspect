import * as React from 'react'
import { useMemo } from 'react'
import { Box, Card, CardContent } from '@mui/material'
import { Helmet } from 'react-helmet'
import { useLocation, useParams } from 'react-router-dom'
import useI18n from '../../hooks/useI18n'
import { useAuthState } from '../../providers/AuthProvider'
import ACTION from './constants'
import ContactDetails from './ContactDetails'
import { DirtyStepsProvider } from './context'
import JobAssigment from './JobAssigment'
import Login from './Login'
import messages from './messages'

const ContactPage = () => {
  const [step, setStep] = React.useState(0)
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
              {step === 0 ? <ContactDetails setStep={setStep} id={id} /> : null}
              {step === 1 ? <JobAssigment setStep={setStep} id={id} /> : null}
              {step === 2 ? <Login setStep={setStep} id={id} /> : null}
            </CardContent>
          </DirtyStepsProvider>
        </Card>
      </Box>
    </>
  )
}

export default ContactPage
