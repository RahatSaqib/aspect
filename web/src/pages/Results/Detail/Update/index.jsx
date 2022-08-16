/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { FaNotesMedical } from 'react-icons/fa'
import CircularProgress from '@mui/material/CircularProgress'
import { useQuery } from 'react-query'
import findIndex from 'lodash/findIndex'

import useI18n from '../../../../hooks/useI18n'
import { FormikProvider } from '../../../../components/Form/Formik/Context'
import AspectForm from '../../../../components/Form'
import FormActions from '../../../../components/Form/formActions'
import { Shell, ShellHeader, ShellContent, ShellFooter } from '../../../../components/Shell'
import { RESULT_DETAIL } from '../../../../components/QueryFetch/Result'
import fetchWrapperForQueries from '../../../../components/QueryFetch'
import { ResultDetailsErrors } from './errors'
import ResultTransferModal from './ResultTransferModal'
import { getFormConfigWithData } from '../utils'

const AspectResultDetail = ({ resultId, onSubmit }) => {
  const intl = useI18n()
  const [patientId, setPatientId] = useState()
  const [values, setValues] = useState(false)
  const [formConfig, setFormConfig] = useState(false)
  const [isTransferResultOpenOpen, setTransferResultOpen] = useState(false)

  const {
    data: queryResponse,
    isLoading,
    isError,
    error,
  } = useQuery([RESULT_DETAIL.KEY, { resultId }], async ({ queryKey: [, { resultId }] }) =>
    fetchWrapperForQueries({
      endpoint: `${RESULT_DETAIL.ENDPOINT}/${resultId}`,
      customErrorNotifications: ResultDetailsErrors,
    })
  )

  if (isError) {
    throw new Error(error)
  }

  useEffect(() => {
    if (isLoading || !queryResponse) return
    if (queryResponse?.ok) {
      const { data } = queryResponse
      if (data.resultCategory1) {
        data.resultCategory1 = `${data.resultCategory1}`
      }
      if (data.resultCategory2) {
        data.resultCategory2 = `${data.resultCategory2}`
      }
      data.patientId = data?.patientId && data?.patientId !== 'null' ? data?.patientId : 'N/A'
      // This is for the title, so wee need the colons
      setPatientId(`: ${data.patientId}`)

      const config = getFormConfigWithData(intl, false, data)

      const action = config.actions.items.find(x => x.id === 'transfer')
      action.onClick = () => setTransferResultOpen(true)
      action.isVisible = (permissions, isEditMode) => {
        return (
          !isEditMode &&
          // eslint-disable-next-line lodash/prefer-some
          findIndex(permissions, elem => elem === 'result:edit') >= 0
        )
      }

      // TODO: Remove this line when result edit functionality is ready (hides the "Edit" button)
      config.actions.items.splice(2)

      setFormConfig(config)
      setValues(data)
    } else {
      throw new Error('Can not fetch data for result')
    }
  }, [isLoading, queryResponse])

  return (
    <Shell>
      {!isLoading && formConfig ? (
        <FormikProvider config={formConfig}>
          <ShellHeader icon={FaNotesMedical} title={`${formConfig.title}${patientId}`}>
            <FormActions config={formConfig} onSubmit={onSubmit} />
          </ShellHeader>
          <ShellContent>
            <AspectForm config={formConfig} />
          </ShellContent>
          <ShellFooter />
          <ResultTransferModal
            data={values}
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
  resultId: PropTypes.number.isRequired,
  onSubmit: PropTypes.func.isRequired,
}

export default AspectResultDetail
