/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'

import { FaNotesMedical } from 'react-icons/fa'
import CircularProgress from '@material-ui/core/CircularProgress'
import { useQuery } from 'react-query'
import { FormikProvider } from '../../../Form/Formik/Context'
import { mergeFormConfigWithData } from '../../../Form/Formik/Helpers'
import AspectForm from '../../../Form'
import FormActions from '../../../Form/formActions'
import Shell from '../../../Shell'
import ShellHeader from '../../../Shell/Header'
import ShellContent from '../../../Shell/Content'
import ShellFooter from '../../../Shell/Footer'
import RESULT_DETAIL from '../../../QueryFetch/Result/index'
import fetchWrapperForQueries from '../../../QueryFetch'
import errors from './errors'

const AspectResultDetail = ({ formSchema, resultId }) => {
  const [formConfig, setFormConfig] = useState(false)
  const [patienId, setPatientId] = useState()

  const {
    isLoading,
    isError,
    data: { data: formData } = false,
    error,
  } = useQuery([RESULT_DETAIL.KEY, { resultId }], async (key, { resultId }) =>
    fetchWrapperForQueries({
      endpoint: `${RESULT_DETAIL.ENDPOINT}/${resultId}`,
      errors,
    })
  )

  if (isError) {
    throw new Error(error)
  }

  useEffect(() => {
    if (formData && formSchema) {
      setPatientId(formData.patientId)
      setFormConfig(mergeFormConfigWithData(formData, formSchema))
    }
  }, [formData, formSchema, resultId])

  return (
    <Shell>
      {!isLoading && formConfig ? (
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

AspectResultDetail.propTypes = {
  formSchema: PropTypes.oneOfType([PropTypes.object]).isRequired,
  resultId: PropTypes.number.isRequired,
}

export default AspectResultDetail
