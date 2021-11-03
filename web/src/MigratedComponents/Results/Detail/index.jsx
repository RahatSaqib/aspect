import React, { Fragment, useEffect, useState } from 'react'
// import { useParams } from 'react-router-dom'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import isNaN from 'lodash/isNaN'
import { useMutation } from 'react-query'

import { sanitizeFormValues } from '../../Form/Formik/Helpers'
import useI18n from '../../../Hooks/i18n/useI18n'
import Create from './Create'
import Update from './Update'
import editConfig from '../Forms/editConfig'
import { RESULT_DETAIL } from '../../QueryFetch/Result'
import fetchWrapperForQueries from '../../QueryFetch/index'
import { getReturnUrl, useUrlQuery } from '../../AspectTable/Helpers'

// import viewConfig from '../Forms/viewConfig'

const AspectResultDetail = () => {
  const { resultId } = useParams()
  const { formatMessage } = useI18n()
  const [schema, setSchema] = useState(false)
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

  useEffect(() => {
    if (!schema) {
      const formSchema =
        resultId === 'add'
          ? editConfig(formatMessage)
          : editConfig(formatMessage)
      setSchema(formSchema)
    }
  }, [schema, formatMessage, resultId])

  const id = isNaN(resultId) ? undefined : Number(resultId)

  const onSubmit = (formik, meta) => {
    const values = sanitizeFormValues(formik.values, { meta })

    submitResult({ values, id })
  }

  return schema ? (
    <Fragment>
      {resultId === 'add' ? (
        <Create formSchema={schema} onSubmit={onSubmit} />
      ) : (
        <Update formSchema={schema} resultId={id} onSubmit={onSubmit} />
      )}
    </Fragment>
  ) : null
}

export default AspectResultDetail
