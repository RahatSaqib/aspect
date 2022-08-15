import React, { Fragment } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import isNaN from 'lodash/isNaN'
import { useMutation } from 'react-query'

import useI18n from '../../../hooks/useI18n'
import { sanitizeFormValues } from '../../../components/Form/Formik/Helpers'
import Create from './Create'
import Update from './Update'
import { RESULT_DETAIL } from '../../../components/QueryFetch/Result'
import fetchWrapperForQueries from '../../../components/QueryFetch/index'
import { getReturnUrl, useUrlQuery } from '../../../components/AspectTable/Helpers'
import getFormConfig from '../Forms/editConfig'

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

  const id = isNaN(resultId) ? undefined : Number(resultId)
  const isNew = resultId === 'add' || !id

  const onSubmit = formik => {
    const formConfig = getFormConfig(intl.formatMessage, isNew)
    const values = sanitizeFormValues(formik.values, { formConfig })

    submitResult({ values, id })
  }

  return <Fragment>{isNew ? <Create onSubmit={onSubmit} /> : <Update resultId={id} onSubmit={onSubmit} />}</Fragment>
}

export default AspectResultDetail
