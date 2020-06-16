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
  const [done, setDone] = useState(false)
  const [formConfig, setFormConfig] = useState(false)
  // const { formSchema, formData } = useSelector(
  //   ({ resultsForm, resultsDetail }) => ({
  //     ...resultsForm.toJS(),
  //     ...resultsDetail.toJS(),
  //   }),
  //   shallowEqual
  // )
  const { formSchema } = useSelector(
    ({ resultsForm }) => ({ ...resultsForm.toJS() }),
    shallowEqual
  )
  const { formData } = useSelector(
    ({ resultsDetail }) => ({ ...resultsDetail.toJS() }),
    shallowEqual
  )
  const prevResultId = usePrevious(resultId)
  const prevFormSchema = usePrevious(formSchema)
  const prevFormData = usePrevious(formData)

  useEffect(() => {
    if (
      (!formSchema && resultId) ||
      (!formSchema && resultId !== prevResultId)
    ) {
      console.log('formSchema', formSchema)
      dispatch(fetchResultsForm(resultId))
    }
  })

  useEffect(() => {
    if (resultId !== 'add') {
      if (formSchema && !done) {
        console.log('fetch data')
        setDone(true)
        dispatch(fetchResultsDetail(resultId))
      }
    }
  }, [resultId, formSchema])

  // dispatch(fetchResultsForm())
  // dispatch(fetchResultsDetail(resultId))

  // console.log(resultId, formData, formSchema)

  return formSchema ? (
    <Fragment>
      {resultId === 'add' ? <Create formSchema={formSchema} /> : null}
      {resultId !== 'add' && formSchema && formData ? (
        <Update formSchema={formSchema} formData={formData} />
      ) : null}
    </Fragment>
  ) : null
}

export default AspectResultDetail
