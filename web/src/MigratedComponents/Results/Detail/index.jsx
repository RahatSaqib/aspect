/* eslint-disable react-hooks/exhaustive-deps */
import React, { Fragment, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { useSelector, useDispatch, shallowEqual } from 'react-redux'

import usePrevious from '../../../Hooks/CustomHooks'
import { fetchResultsDetail } from './Redux/resultsDetail'
import { fetchResultsForm } from './Redux/resultsForm'

import Create from './Create'
import Update from './Update'

const AspectResultDetail = ({ match }) => {
  const { params } = match
  const { resultId } = params
  const dispatch = useDispatch()
  const [done, setDone] = useState(false)
  const { formSchema } = useSelector(
    ({ resultsForm }) => ({ ...resultsForm.toJS() }),
    shallowEqual
  )
  const { formData } = useSelector(
    ({ resultsDetail }) => ({ ...resultsDetail.toJS() }),
    shallowEqual
  )
  const prevResultId = usePrevious(resultId)

  useEffect(() => {
    if (
      (!formSchema && resultId) ||
      (!formSchema && resultId !== prevResultId)
    ) {
      dispatch(fetchResultsForm(resultId))
    }
  })

  useEffect(() => {
    if (resultId !== 'add') {
      if (formSchema && !done) {
        setDone(true)
        dispatch(fetchResultsDetail(resultId))
      }
    }
  }, [resultId, formSchema])

  console.log(formSchema)

  return formSchema ? (
    <Fragment>
      {resultId === 'add' ? <Create formSchema={formSchema} /> : null}
      {resultId !== 'add' && formSchema && formData ? (
        <Update formSchema={formSchema} formData={formData} />
      ) : null}
    </Fragment>
  ) : null
}

AspectResultDetail.propTypes = {
  match: PropTypes.oneOfType([PropTypes.object]).isRequired,
}

export default AspectResultDetail
