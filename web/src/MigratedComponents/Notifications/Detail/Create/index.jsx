import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { FaNotesMedical } from 'react-icons/fa'
import CircularProgress from '@material-ui/core/CircularProgress'

import useI18n from '../../../../Hooks/i18n/useI18n'
import { FormikProvider } from '../../../Form/Formik/Context'

import AspectForm from '../../../Form'
import FormActions from '../../../Form/formActions'
import Shell from '../../../Shell'
import ShellHeader from '../../../Shell/Header'
import ShellContent from '../../../Shell/Content'
import ShellFooter from '../../../Shell/Footer'
import { getFormConfigWithData } from '../utils'

const AspectNotificationDetail = ({ notificationType }) => {
  const intl = useI18n()
  const [formConfig] = useState(getFormConfigWithData(intl, notificationType))

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

AspectNotificationDetail.propTypes = {
  notificationType: PropTypes.string.isRequired,
}

export default AspectNotificationDetail
