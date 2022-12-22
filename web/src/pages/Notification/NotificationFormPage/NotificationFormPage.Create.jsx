import React, { useEffect, useState } from 'react'
import { CircularProgress } from '@mui/material'
import { FaNotesMedical } from 'react-icons/fa'
import './NotificationFormPage.css'
import AspectForm from '../../../components/Form'
import FormActions from '../../../components/Form/formActions'
import { FormikProvider } from '../../../components/Form/Formik/Context'
import { Shell, ShellHeader, ShellContent, ShellFooter } from '../../../components/Shell'
import useJobFunctions from '../../../hooks/jobFunction/useJobFunctions'
import usePartner from '../../../hooks/partner/usePartner'
import useI18n from '../../../hooks/useI18n'
import validationSchema from './Forms/validation'
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
    <Shell>
      <FormikProvider config={formConfig}>
        <ShellHeader icon={FaNotesMedical} title={formConfig.title}>
          <FormActions config={formConfig} onSubmit={onSubmit} />
        </ShellHeader>
        <ShellContent>
          <AspectForm config={formConfig} />
        </ShellContent>
        <ShellFooter />
      </FormikProvider>
    </Shell>
  )
}

export default NotificationFormPage
