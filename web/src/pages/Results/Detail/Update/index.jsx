/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react'
import { LinearProgress, Box, Card, CardContent } from '@mui/material'
import PropTypes from 'prop-types'
import { useQuery } from 'react-query'
import DetailHeader from '../../../../components/DetailHeader'
import AspectForm from '../../../../components/Form'
import { FormikProvider } from '../../../../components/Form/Formik/Context'
import fetchWrapperForQueries from '../../../../components/QueryFetch'
import { RESULT_DETAIL } from '../../../../components/QueryFetch/Result'
import useI18n from '../../../../hooks/useI18n'
import AspectButton from '../../../../oldComponents/shared/AspectButton'
import messages from '../messages'
import { getFormConfigWithData } from '../utils'
import { ResultDetailsErrors } from './errors'
import ResultTransferModal from './ResultTransferModal'

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

      if (onSubmit) {
        // do something with submit when edition is enabled
      }

      // const action = config.actions.items.find(x => x.id === 'transfer')
      // action.isVisible = (permissions, isEditMode) => {
      //   return (
      //     !isEditMode &&
      //     // eslint-disable-next-line lodash/prefer-some
      //     findIndex(permissions, elem => elem === 'result:edit') >= 0
      //   )
      // }

      // TODO: Remove this line when result edit functionality is ready (hides the "Edit" button)
      config.actions.items.splice(2)

      setFormConfig(config)
      setValues(data)
    } else {
      throw new Error('Can not fetch data for result')
    }
  }, [isLoading, queryResponse])

  return (
    <>
      <DetailHeader name={`${formConfig.title}${patientId}`} back="/browse/result">
        {[{ label: intl.formatMessage(messages.transferResult) }].map(({ label }) => (
          // find other buttons in config and handle them properly
          <AspectButton
            key={label}
            onClick={() => setTransferResultOpen(true)}
            disabled={isTransferResultOpenOpen}
            color="primary"
            variant="contained"
          >
            {label}
          </AspectButton>
        ))}
      </DetailHeader>
      <Box component="main" sx={{ pt: 9, pr: 1, pl: 1, pb: 1 }}>
        <Card>
          <CardContent>
            {isLoading || !formConfig ? (
              <LinearProgress />
            ) : (
              <FormikProvider config={formConfig}>
                <AspectForm config={formConfig} />
                <ResultTransferModal
                  data={values}
                  isOpen={isTransferResultOpenOpen}
                  onClose={() => setTransferResultOpen(false)}
                />
              </FormikProvider>
            )}
          </CardContent>
        </Card>
      </Box>
    </>
  )
}

AspectResultDetail.propTypes = {
  resultId: PropTypes.number.isRequired,
  onSubmit: PropTypes.func.isRequired,
}

export default AspectResultDetail
