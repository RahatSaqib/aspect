import React, { Fragment } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import isNaN from 'lodash/isNaN'
import { useMutation } from 'react-query'

import useI18n from '../../../Hooks/i18n/useI18n'
import { sanitizeFormValues } from '../../Form/Formik/Helpers'
import Create from './Create'
import Update from './Update'
import { RESULT_DETAIL } from '../../QueryFetch/Result'
import fetchWrapperForQueries from '../../QueryFetch/index'
import { getReturnUrl, useUrlQuery } from '../../AspectTable/Helpers'
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

  const onSubmit = formik => {
    const formConfig = getFormConfig(intl.formatMessage, false)
    const values = sanitizeFormValues(formik.values, { formConfig })

    /**
     * TODO: remove below console.log after implementing submission of form in
     * https://ops.systemone.id/browse/ASP-2344
     */
    // eslint-disable-next-line
    console.log('>>>>>>>>>>>>>>>', JSON.stringify(values, null, 2))

    submitResult({ values, id })
  }

  return (
    <Fragment>
      {resultId === 'add' || !id ? (
        <Create onSubmit={onSubmit} />
      ) : (
        <Update resultId={id} onSubmit={onSubmit} />
      )}
    </Fragment>
  )
}

export default AspectResultDetail
