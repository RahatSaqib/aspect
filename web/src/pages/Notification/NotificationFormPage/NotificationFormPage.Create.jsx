import React, { useEffect, useState } from 'react'
import { CircularProgress, Box, Card, CardContent } from '@mui/material'
import { useFormikContext } from 'formik'
import './NotificationFormPage.css'
import DetailHeader from '../../../components/DetailHeader'
import AspectForm from '../../../components/Form'
import { FormikProvider } from '../../../components/Form/Formik/Context'
import useJobFunctions from '../../../hooks/jobFunction/useJobFunctions'
import usePartner from '../../../hooks/partner/usePartner'
import useI18n from '../../../hooks/useI18n'
import AspectButton from '../../../oldComponents/shared/AspectButton'
import validationSchema from './Forms/validation'
import messages from './messages'
import { getFormConfigWithData } from './utils'

const NotificationFormPage = ({ onSubmit }) => {
  const intl = useI18n()
  const [formConfig, setFormConfig] = useState(false)
  const { data: jobFunctions, isLoading } = useJobFunctions()
  const { data: partner, isLoading: partnerLoading } = usePartner()

  useEffect(() => {
    if (jobFunctions && partner) {
      const form = getFormConfigWithData(intl, jobFunctions, partner, validationSchema(intl.formatMessage), false, null)
      setFormConfig(form)
    }
  }, [intl, jobFunctions, partner, partnerLoading])

  return isLoading || !formConfig ? (
    <CircularProgress />
  ) : (
    <FormikProvider config={formConfig}>
      <NotificationForm formConfig={formConfig} onSubmit={onSubmit} />
    </FormikProvider>
  )
}

const NotificationForm = ({ formConfig, onSubmit }) => {
  const intl = useI18n()
  const { formik, meta } = useFormikContext()
  return (
    <>
      <DetailHeader name={formConfig.title} back="/browse/notification">
        {[{ label: intl.formatMessage(messages.save), onClick: () => onSubmit(formik, meta) }].map(
          ({ label, onClick, disabled = false }) => (
            <AspectButton
              key={label}
              onClick={onClick}
              disabled={disabled}
              color="primary"
              variant="contained"
              style={{ margin: '0 4px' }}
            >
              {label}
            </AspectButton>
          )
        )}
      </DetailHeader>
      <Box component="main" sx={{ p: 1 }}>
        <Card>
          <CardContent>
            <AspectForm config={formConfig} />
          </CardContent>
        </Card>
      </Box>
    </>
  )
}

export default NotificationFormPage
