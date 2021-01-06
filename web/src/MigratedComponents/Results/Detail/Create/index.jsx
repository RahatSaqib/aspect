import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { FaNotesMedical } from 'react-icons/fa'
import CircularProgress from '@material-ui/core/CircularProgress'

import usePrevious from '../../../../Hooks/CustomHooks'
import { FormikProvider } from '../../../Form/Formik/Context'
import { mergeFormConfigWithData } from '../../../Form/Formik/Helpers'

import AspectForm from '../../../Form'
import FormActions from '../../../Form/formActions'
import Shell from '../../../Shell'
import ShellHeader from '../../../Shell/Header'
import ShellContent from '../../../Shell/Content'
import ShellFooter from '../../../Shell/Footer'

const AspectResultDetail = ({ formSchema }) => {
  const [formConfig, setFormConfig] = useState(false)
  const prevFormSchema = usePrevious(formSchema)

  useEffect(() => {
    if (formSchema || formSchema !== prevFormSchema) {
      setFormConfig(mergeFormConfigWithData({}, formSchema))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formSchema])

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
  formSchema: PropTypes.oneOfType([PropTypes.object]).isRequired,
}

export default AspectResultDetail
