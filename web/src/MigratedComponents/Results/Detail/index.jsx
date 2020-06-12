/* eslint-disable react-hooks/exhaustive-deps */
import React, { Fragment, useEffect, useState } from 'react'
import { useSelector, useDispatch, shallowEqual } from 'react-redux'
import { FaNotesMedical } from 'react-icons/fa'
import CircularProgress from '@material-ui/core/CircularProgress'
import isEqual from 'lodash/isEqual'

import usePrevious from '../../../Hooks/CustomHooks'
import { fetchResultsDetail } from './Redux/resultsDetail'
import { fetchResultsForm } from './Redux/resultsForm'
import { FormikProvider } from '../../Form/Formik/Context'
import { mergeFormConfigWithData } from '../../Form/Formik/Helpers'

import Create from './Create'
import Update from './Update'

const AspectResultDetail = ({ match }) => {
  const { params } = match
  const { resultId } = params
  const dispatch = useDispatch()
  const [formConfig, setFormConfig] = useState(false)
  const { formSchema } = useSelector(
    ({ resultsForm }) => ({
      ...resultsForm.toJS(),
    }),
    shallowEqual
  )
  const prevResultId = usePrevious(resultId)
  const prevFormSchema = usePrevious(formSchema)

  useEffect(() => {
    if (resultId || !isEqual(resultId, prevResultId)) {
      if (!formSchema || !isEqual(formSchema, prevFormSchema)) {
        dispatch(fetchResultsForm())
      }
    }
  }, [resultId])

  console.log(formSchema)

  return (
    <Fragment>
      {formSchema ? (
        <Create formSchema={formSchema} />
      ) : (
        <Update formSchema={formSchema} />
      )}
    </Fragment>
  )
}

export default AspectResultDetail
