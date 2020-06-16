/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useEffect, useState } from 'react'
import { useSelector, useDispatch, shallowEqual } from 'react-redux'
import { FaNotesMedical } from 'react-icons/fa'
import CircularProgress from '@material-ui/core/CircularProgress'
import isEqual from 'lodash/isEqual'

import usePrevious from '../../../Hooks/CustomHooks'
import { fetchResultsDetail } from './Redux/resultsDetail'
import { fetchResultsForm } from './Redux/resultsForm'
import { FormikProvider } from '../../Form/Formik/Context'
import { mergeFormConfigWithData } from '../../Form/Formik/Helpers'

import AspectForm from '../../Form'
import FormActions from '../../Form/formActions'
import Shell from '../Shell'
import ShellHeader from '../Shell/Header'
import ShellContent from '../Shell/Content'
import ShellFooter from '../Shell/Footer'

const AspectResultDetail = ({ formSchema, resultId }) => {
  const dispatch = useDispatch()
  const [formConfig, setFormConfig] = useState(false)
  const [patienId, setPatientId] = useState()
  const { formData } = useSelector(({ resultsDetail }) => ({
    ...resultsDetail.toJS(),
  }))

  const prevFormConfig = usePrevious(formConfig)
  const prevFormData = usePrevious(formData)

  // console.log(formSchema, formData)
  // console.log(formSchema, resultId, formConfig, formData)
  useEffect(() => {
    if (formSchema && formData) {
      setPatientId(formData.patientId)
      setFormConfig(mergeFormConfigWithData(formData, formSchema))
    }
  }, [formSchema, formData])

  return (
    <Shell>
      {formConfig ? (
        <FormikProvider config={formConfig}>
          <ShellHeader
            icon={FaNotesMedical}
            title={`${formConfig.title}: ${patienId}`}
          >
            <FormActions config={formConfig} />
          </ShellHeader>
          <ShellContent>
            <AspectForm config={formConfig} />
          </ShellContent>
          <ShellFooter />
        </FormikProvider>
      ) : (
        <CircularProgress />
      )}
    </Shell>
  )
}

export default AspectResultDetail
