/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react'
import { CircularProgress } from '@mui/material'
import findIndex from 'lodash/findIndex'
import { FaNotesMedical } from 'react-icons/fa'
import { useMutation, useQuery } from 'react-query'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { getReturnUrl, useUrlQuery } from '../../../components/AspectTable/Helpers'
import AspectForm from '../../../components/Form'
import FormActions from '../../../components/Form/formActions'
import { FormikProvider } from '../../../components/Form/Formik/Context'
import { sanitizeFormValues } from '../../../components/Form/Formik/Helpers'
import fetchWrapperForQueries from '../../../components/QueryFetch/index'
import { RESULT_DETAIL } from '../../../components/QueryFetch/Result'
import { Shell, ShellHeader, ShellContent, ShellFooter } from '../../../components/Shell'
import useI18n from '../../../hooks/useI18n'
import getFormConfig from '../Forms/editConfig'
import { ResultDetailsErrors } from './errors'
import ResultTransferModal from './ResultTransferModal'
import { getFormConfigWithData } from './utils'

const AspectResultDetail = () => {
  const intl = useI18n()
  const { resultId } = useParams()
  const navigate = useNavigate()
  const { search } = useLocation()
  const query = useUrlQuery(search)
  const [patientId, setPatientId] = useState()
  const [values, setValues] = useState(false)
  const [formConfig, setFormConfig] = useState(false)
  const [isTransferResultOpenOpen, setTransferResultOpen] = useState(false)

  const {
    data: queryResponse,
    isLoading,
    isError,
    error,
  } = useQuery([RESULT_DETAIL.KEY, { resultId }], async ({ queryKey: [, { resultId }] }) =>
    fetchWrapperForQueries({
      endpoint: `${RESULT_DETAIL.ENDPOINT}/${resultId}`,
      customErrorNotifications: ResultDetailsErrors,
    })
  )

  if (isError) {
    throw new Error(error)
  }

  useEffect(() => {
    if (isLoading || !queryResponse) return
    if (queryResponse?.ok) {
      const { data } = queryResponse
      if (data.resultCategory1) {
        data.resultCategory1 = `${data.resultCategory1}`
      }
      if (data.resultCategory2) {
        data.resultCategory2 = `${data.resultCategory2}`
      }
      data.patientId = data?.patientId && data?.patientId !== 'null' ? data?.patientId : 'N/A'
      // This is for the title, so wee need the colons
      setPatientId(`: ${data.patientId}`)

      const config = getFormConfigWithData(intl, false, data)

      const action = config.actions.items.find(x => x.id === 'transfer')
      action.onClick = () => setTransferResultOpen(true)
      action.isVisible = (permissions, isEditMode) => {
        return (
          !isEditMode &&
          // eslint-disable-next-line lodash/prefer-some
          findIndex(permissions, elem => elem === 'result:edit') >= 0
        )
      }

      // TODO: Remove this line when result edit functionality is ready (hides the "Edit" button)
      config.actions.items.splice(2)

      setFormConfig(config)
      setValues(data)
    } else {
      throw new Error('Can not fetch data for result')
    }
  }, [isLoading, queryResponse])

  const { mutate: submitResult } = useMutation(
    ({ values, id }) => {
      let endpoint = RESULT_DETAIL.ENDPOINT
      if (id) {
        endpoint += `/${id}`
      }

      return fetchWrapperForQueries({
        endpoint,
        method: id ? 'PUT' : 'POST',
        params: {
          ...values,
        },
      })
    },
    {
      onSuccess: () => {
        const path = getReturnUrl(query.get('returnUrl'), `/browse/result`)
        navigate(path)
      },
    }
  )

  const onSubmit = formik => {
    const formConfig = getFormConfig(intl.formatMessage, false)
    const values = sanitizeFormValues(formik.values, { formConfig })

    submitResult({ values, resultId })
  }

  return (
    <Shell>
      {!isLoading && formConfig ? (
        <FormikProvider config={formConfig}>
          <ShellHeader icon={FaNotesMedical} title={`${formConfig.title}${patientId}`}>
            <FormActions config={formConfig} onSubmit={onSubmit} />
          </ShellHeader>
          <ShellContent>
            <AspectForm config={formConfig} />
          </ShellContent>
          <ShellFooter />
          <ResultTransferModal
            data={values}
            isOpen={isTransferResultOpenOpen}
            onClose={() => setTransferResultOpen(false)}
          />
        </FormikProvider>
      ) : (
        <CircularProgress />
      )}
    </Shell>
  )
}

export default AspectResultDetail
