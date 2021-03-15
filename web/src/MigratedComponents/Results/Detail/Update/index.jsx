/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'

import { FaNotesMedical } from 'react-icons/fa'
import CircularProgress from '@material-ui/core/CircularProgress'
import { useQuery } from 'react-query'
import findIndex from 'lodash/findIndex'
import { FormikProvider } from '../../../Form/Formik/Context'
import { mergeFormConfigWithData } from '../../../Form/Formik/Helpers'
import AspectForm from '../../../Form'
import FormActions from '../../../Form/formActions'
import Shell from '../../../Shell'
import ShellHeader from '../../../Shell/Header'
import ShellContent from '../../../Shell/Content'
import ShellFooter from '../../../Shell/Footer'
import { RESULT_DETAIL } from '../../../QueryFetch/Result'
import fetchWrapperForQueries from '../../../QueryFetch'
import { ResultDetailsErrors } from './errors'
import ResultTransferModal from './ResultTransferModal'

const AspectResultDetail = ({ formSchema, resultId }) => {
  const [patienId, setPatientId] = useState()
  const [formData, setFormData] = useState(false)
  const [formConfig, setFormConfig] = useState(false)
  const [isTransferResultOpenOpen, setTransferResultOpen] = useState(false)

  const { isLoading, isError, error } = useQuery(
    [RESULT_DETAIL.KEY, { resultId }],
    async (key, { resultId }) =>
      fetchWrapperForQueries({
        endpoint: `${RESULT_DETAIL.ENDPOINT}/${resultId}`,
        errors: ResultDetailsErrors,
      }),
    { onSuccess: setFormData }
  )

  if (isError) {
    throw new Error(error)
  }

  useEffect(() => {
    // define few extra props for `transfer` button
    const action = formSchema.actions.items.find(x => x.id === 'transfer')
    action.onClick = () => setTransferResultOpen(true)
    action.isVisible = (permissions, isEditMode) => {
      return (
        !isEditMode &&
        // eslint-disable-next-line lodash/prefer-some
        findIndex(permissions, elem => elem === 'result:edit') >= 0
      )
    }
  }, [])

  useEffect(() => {
    if (formData) {
      const { data } = formData
      setPatientId(data.patientId)
      setFormConfig(mergeFormConfigWithData(data, formSchema))
    }
  }, [formData])

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
          <ResultTransferModal
            data={formData.data}
            isOpen={isTransferResultOpenOpen}
            onClose={() => setTransferResultOpen(false)}
          />
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
