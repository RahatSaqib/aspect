import * as React from 'react'
import { Box, Card, CardContent } from '@mui/material'
import { Helmet } from 'react-helmet'
import { useParams } from 'react-router-dom'
import useI18n from '../../hooks/useI18n'
import { useAuthState } from '../../providers/AuthProvider'
import ACTION from './constants'
import ContactPageStepOne from './ContactPage.Step1'
import ContactPageStepTwo from './ContactPage.Step2'
import ContactPageStepThree from './ContactPage.Step3'
import messages from './messages'

const ContactPage = () => {
  const [step, setStep] = React.useState(0)
  const { formatMessage } = useI18n()
  const { personId } = useParams()
  const { userId: loggedInUserId } = useAuthState()

  const id = personId
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
          <CardContent>
            {step === 0 ? <ContactPageStepOne setStep={setStep} id={id} /> : null}
            {step === 1 ? <ContactPageStepTwo setStep={setStep} id={id} /> : null}
            {step === 2 ? <ContactPageStepThree setStep={setStep} id={id} /> : null}
          </CardContent>
        </Card>
      </Box>
    </>
  )
}

export default ContactPage
