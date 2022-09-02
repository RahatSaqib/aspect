import React, { useEffect, useState } from 'react'
import CircularProgress from '@mui/material/CircularProgress'
import PropTypes from 'prop-types'
import { FaNotesMedical } from 'react-icons/fa'
import AspectForm from '../../../../components/Form'
import FormActions from '../../../../components/Form/formActions'
import { FormikProvider } from '../../../../components/Form/Formik/Context'
import Shell from '../../../../components/Shell'
import ShellContent from '../../../../components/Shell/Content'
import ShellFooter from '../../../../components/Shell/Footer'
import ShellHeader from '../../../../components/Shell/Header'
import useI18n from '../../../../hooks/useI18n'
import { getFormConfigWithData } from '../utils'

const AspectResultDetail = ({ onSubmit }) => {
  const intl = useI18n()
  const [formConfig, setFormConfig] = useState(false)

  useEffect(() => {
    setFormConfig(getFormConfigWithData(intl, true, {}))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Shell>
      {formConfig ? (
        <FormikProvider config={formConfig}>
          <ShellHeader icon={FaNotesMedical} title={formConfig.title}>
            <FormActions config={formConfig} onSubmit={onSubmit} />
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
  onSubmit: PropTypes.func.isRequired,
}

export default AspectResultDetail
