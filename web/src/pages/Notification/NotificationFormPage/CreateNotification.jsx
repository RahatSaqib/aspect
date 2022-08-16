import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { FaNotesMedical } from 'react-icons/fa'
import CircularProgress from '@mui/material/CircularProgress'

import useI18n from '../../../hooks/useI18n'
import { FormikProvider } from '../../../components/Form/Formik/Context'

import AspectForm from '../../../components/Form'
import FormActions from '../../../components/Form/formActions'
import { Shell, ShellHeader, ShellContent, ShellFooter } from '../../../components/Shell'
import { getFormConfigWithData } from './utils'
import validationSchema from './Forms/validation'

const AspectNotificationDetail = ({ jobFunctions, onSubmit }) => {
  const intl = useI18n()
  const [formConfig] = useState(
    getFormConfigWithData(intl, jobFunctions, '', '', validationSchema(intl.formatMessage), false, null)
  )
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

AspectNotificationDetail.propTypes = {
  jobFunctions: PropTypes.arrayOf(PropTypes.object).isRequired,
  onSubmit: PropTypes.func.isRequired,
}

export default AspectNotificationDetail
