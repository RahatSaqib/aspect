import React, { useState } from 'react'
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
import validationSchema from '../../Forms/validation'
import { getFormConfigWithData } from '../utils'

const AspectNotificationDetail = ({ notificationType, jobFunctions, onSubmit }) => {
  const intl = useI18n()
  const [formConfig] = useState(
    getFormConfigWithData(intl, jobFunctions, notificationType, '', validationSchema(intl.formatMessage), false, null)
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
  notificationType: PropTypes.string.isRequired,
  jobFunctions: PropTypes.arrayOf(PropTypes.object).isRequired,
  onSubmit: PropTypes.func.isRequired,
}

export default AspectNotificationDetail
