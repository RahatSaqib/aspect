/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { FaNotesMedical } from 'react-icons/fa'
import CircularProgress from '@material-ui/core/CircularProgress'
import { useQuery } from 'react-query'

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
import { NOTIFICATION_DETAIL } from '../../../QueryFetch/Notification'
import fetchWrapperForQueries from '../../../QueryFetch'
import messages from '../messages'

const AspectNotificationDetail = ({ notificationId }) => {
  const { formatMessage } = useI18n()
  const [formConfig, setFormConfig] = useState(false)

  const { isLoading, isError, error } = useQuery(
    [NOTIFICATION_DETAIL.KEY, { notificationId }],
    async ({ queryKey: [, { notificationId }] }) =>
      fetchWrapperForQueries({
        endpoint: `${NOTIFICATION_DETAIL.ENDPOINT}/${notificationId}`,
      }),
    {
      onSuccess: resp => {
        const { data } = resp
        const { notificationTypeName, notificationType } = data

        const initialValues = {
          ...getInitialValuesFromFormConfig(formSchema),
          notificationTypeName, // to display as read-only field
          notificationType, // to keep in formik.values as hidden field
        }

        const formSchema = getFormConfig(formatMessage, notificationType)
        setFormConfig(
          mergeFormConfigWithData(initialValues, formSchema, messages)
        )
      },
    }
  )

  if (isError) {
    throw new Error(error)
  }

  return (
    <Shell>
      {!isLoading && formConfig ? (
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

AspectNotificationDetail.propTypes = {
  notificationId: PropTypes.number.isRequired,
}

export default AspectNotificationDetail
