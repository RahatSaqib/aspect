import React from 'react'
import { useMutation } from 'react-query'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { getReturnUrl, useUrlQuery } from '../../../components/AspectTable/Helpers'
import { sanitizeFormValues } from '../../../components/Form/Formik/Helpers'
import fetchWrapperForQueries from '../../../components/QueryFetch/index'
import { RESULT_DETAIL } from '../../../components/QueryFetch/Result'
import useI18n from '../../../hooks/useI18n'
import getFormConfig from '../Forms/editConfig'
import Update from './Update'

const AspectResultDetail = () => {
  const intl = useI18n()
  const { resultId } = useParams()
  const navigate = useNavigate()
  const { search } = useLocation()
  const query = useUrlQuery(search)

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

    submitResult({ values, id: resultId })
  }

  return <Update resultId={resultId} onSubmit={onSubmit} />
}

export default AspectResultDetail
