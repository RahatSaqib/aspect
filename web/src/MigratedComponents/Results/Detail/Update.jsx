/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { useSelector } from 'react-redux'
import { FaNotesMedical } from 'react-icons/fa'
import CircularProgress from '@material-ui/core/CircularProgress'

import { FormikProvider } from '../../Form/Formik/Context'
import { mergeFormConfigWithData } from '../../Form/Formik/Helpers'

import AspectForm from '../../Form'
import FormActions from '../../Form/formActions'
import Shell from '../../Shell'
import ShellHeader from '../../Shell/Header'
import ShellContent from '../../Shell/Content'
import ShellFooter from '../../Shell/Footer'

const AspectResultDetail = ({ formSchema }) => {
  const [formConfig, setFormConfig] = useState(false)
  const [patienId, setPatientId] = useState()
  const { formData } = useSelector(({ resultsDetail }) => ({
    ...resultsDetail.toJS(),
  }))

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

AspectResultDetail.propTypes = {
  formSchema: PropTypes.oneOfType([PropTypes.object]).isRequired,
}

export default AspectResultDetail
