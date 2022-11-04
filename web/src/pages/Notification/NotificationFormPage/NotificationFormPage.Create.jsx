import React, { useEffect, useState } from 'react'
import { CircularProgress } from '@mui/material'
import map from 'lodash/map'
import reduce from 'lodash/reduce'
import unset from 'lodash/unset'
import { FaNotesMedical } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import './NotificationFormPage.css'
import AspectForm from '../../../components/Form'
import FormActions from '../../../components/Form/formActions'
import { FormikProvider } from '../../../components/Form/Formik/Context'
import { sanitizeFormValues } from '../../../components/Form/Formik/Helpers'
import { Shell, ShellHeader, ShellContent, ShellFooter } from '../../../components/Shell'
import useJobFunctions from '../../../hooks/jobFunction/useJobFunctions'
import useSaveNotification from '../../../hooks/notification/saveNotifiaction'
import usePartner from '../../../hooks/partner/usePartner'
import useI18n from '../../../hooks/useI18n'
import getFormConfig from './Forms/editConfig'
import validationSchema from './Forms/validation'
import { getFormConfigWithData } from './utils'

const NotificationFormPage = () => {
  const intl = useI18n()
  const navigate = useNavigate()
  const [formConfig, setFormConfig] = useState(false)
  const { data: jobFunctions, isLoading } = useJobFunctions()
  const { mutate: submitNotification } = useSaveNotification()
  const { data: partner, isLoading: partnerLoading } = usePartner()

  useEffect(() => {
    if (jobFunctions && partner) {
      const form = getFormConfigWithData(intl, jobFunctions, partner, validationSchema(intl.formatMessage), false, null)
      setFormConfig(form)
    }
  }, [intl, jobFunctions, partner, partnerLoading])

  const onSubmit = formik => {
    const specificPersonId = 'specificPerson'
    const formConfig = getFormConfig(intl.formatMessage, jobFunctions, partner, false)
    const values = sanitizeFormValues(formik.values, { formConfig })
    const { deviceLevelId } = formik.values
    values.notificationType = formik.values.notificationType
    values.jobFunctions.map((jf, index) => {
      jf.jobFunctionId = formik.values.jobFunctions[index].jobFunctionId
      if (jf.tags === '') {
        jf.tags = []
      }
      return jf
    })
    // sanitise persons for post endpoint
    const sanitisedPersons = reduce(
      formik.values.persons,
      (acc, curr) => {
        ;(acc || ((acc = []) && curr?.length)).push({
          personId: curr?.value,
          checked: true,
        })
        return acc
      },
      []
    )
    values.jobFunctions = values.jobFunctions.filter(
      ({ checked, jobFunctionId }) => checked && jobFunctionId !== specificPersonId
    )
    if (sanitisedPersons?.length) {
      values.persons = sanitisedPersons
    }
    if (!values?.jobFunctions?.length) {
      unset(values, 'jobFunctions')
    }
    if (!values?.persons?.length) {
      unset(values, 'persons')
    }
    /**
     * fun little excercise to sanitise three different
     * areaItem fields (state|lga|lab) into a single DB field :)
     */
    if (deviceLevelId === 'state') {
      values.areaItems = values.areaItemsState
      delete values.areaItemsState
    }
    if (deviceLevelId === 'lga') {
      values.areaItems = map(values.areaItemsLGA, ({ label, value }) => ({
        label,
        value,
      }))
      delete values.areaItemsLGA
    }
    if (deviceLevelId === 'lab') {
      values.areaItems = values.areaItemsLab
      delete values.areaItemsLab
    }

    if (values?.notificationType !== 'reportBased') {
      unset(values, 'cronRecurrency')
    } else {
      values.cronRecurrency = formik.values.cronRecurrency.cronExpression
      values.reportFrecuency = formik.values.cronRecurrency.frecuency
    }

    submitNotification(
      { values, id: undefined },
      {
        onSuccess: () => navigate('/browse/notification'),
      }
    )
  }

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
