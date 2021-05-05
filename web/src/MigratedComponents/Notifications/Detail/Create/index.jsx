import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { FaNotesMedical } from 'react-icons/fa'
import CircularProgress from '@material-ui/core/CircularProgress'

import useI18n from '../../../../Hooks/i18n/useI18n'
import { FormikProvider } from '../../../Form/Formik/Context'
import {
  getInitialValuesFromFormConfig,
  mergeFormConfigWithData,
} from '../../../Form/Formik/Helpers'

import AspectForm from '../../../Form'
import FormActions from '../../../Form/formActions'
import Shell from '../../../Shell'
import ShellHeader from '../../../Shell/Header'
import ShellContent from '../../../Shell/Content'
import ShellFooter from '../../../Shell/Footer'
import getFormConfig from '../../Forms/editConfig'
import { getNotificationMeta } from '../../List/config'
import messages from '../messages'

const AspectResultDetail = ({ notificationType }) => {
  const { formatMessage } = useI18n()
  const [formConfig, setFormConfig] = useState(false)

  useEffect(() => {
    if (!formConfig) {
      const formSchema = getFormConfig(formatMessage, notificationType)
      const { name, value } = getNotificationMeta(notificationType)
      const initialValues = {
        ...getInitialValuesFromFormConfig(formSchema),
        notificationTypeName: name, // to display as read-only field
        notificationType: value, // to keep in formik.values as hidden field
      }
      setFormConfig(
        mergeFormConfigWithData(initialValues, formSchema, messages)
      )
    }
  }, [formConfig, formatMessage, notificationType])

  return (
    <Shell>
      {formConfig ? (
        <FormikProvider config={formConfig}>
          <ShellHeader icon={FaNotesMedical} title={formConfig.title}>
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
  notificationType: PropTypes.string.isRequired,
}

export default AspectResultDetail
