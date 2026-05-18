import React, { useEffect, useState } from 'react'
import { CircularProgress, Box, Card, CardContent, Grid } from '@mui/material'
import { useFormikContext } from 'formik'
import './NotificationFormPage.module.css'
import isEmpty from 'lodash/isEmpty'
import { useIntl } from 'react-intl'
import { DetailHeader } from '../../../components'
import AspectForm from '../../../components/Form'
import { FormikProvider } from '../../../components/Form/Formik/Context'
import useJobFunctions from '../../../hooks/jobFunction/useJobFunctions'
import usePartner from '../../../hooks/partner/usePartner'
import AspectButton from '../../../components/shared/AspectButton'
import validationSchema from './Forms/validation'
import messages from './messages'
import NotificationFormPreview from './NotificationFormPage.Preview'
import { getFormConfigWithData } from './utils'

const NotificationFormPage = ({ onSubmit }) => {
  const intl = useIntl()
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
  const intl = useIntl()
  const { formik, meta } = useFormikContext()

  return (
    <>
      <DetailHeader name={formConfig.title} back="/browse/notification/types">
        {[
          {
            disabled: !formik.dirty || !formik.isValid || formik.isSubmitting,
            label: intl.formatMessage(messages.save),
            onClick: async () => {
              const errors = await formik.validateForm()
              if (isEmpty(errors)) {
                onSubmit(formik, meta)
              }
            },
          },
        ].map(({ label, onClick, disabled }) => (
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
        ))}
      </DetailHeader>
      <Box component="main" sx={{ p: 1, width: '100%' }}>
        <Card>
          <CardContent>
            <Grid container spacing={1}>
              <Grid item xs={8}>
                <h2>{intl.formatMessage(messages.buildNotification)}</h2>
                <AspectForm config={formConfig} />
              </Grid>
              <Grid item xs={4}>
                <NotificationFormPreview values={formik.values} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </>
  )
}

export default NotificationFormPage
