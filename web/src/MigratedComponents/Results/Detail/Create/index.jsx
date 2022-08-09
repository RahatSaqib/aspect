import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { FaNotesMedical } from 'react-icons/fa'
import CircularProgress from '@mui/material/CircularProgress'

import AspectForm from '../../../Form'
import FormActions from '../../../Form/formActions'
import Shell from '../../../Shell'
import ShellHeader from '../../../Shell/Header'
import ShellContent from '../../../Shell/Content'
import ShellFooter from '../../../Shell/Footer'

import useI18n from '../../../../Hooks/i18n/useI18n'
import { FormikProvider } from '../../../Form/Formik/Context'
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
