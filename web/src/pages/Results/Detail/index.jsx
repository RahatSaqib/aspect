/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react'
import { CircularProgress, Box, CardContent, Card } from '@mui/material'
import { formatInTimeZone } from 'date-fns-tz'
import { useFormikContext } from 'formik'
import keys from 'lodash/keys'
import reduce from 'lodash/reduce'
import startCase from 'lodash/startCase'
import trim from 'lodash/trim'
import { useIntl } from 'react-intl'
import { useMutation, useQuery } from 'react-query'
import { useSelector } from 'react-redux'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { DetailHeader } from '../../../components'
import AspectForm from '../../../components/Form'
import { FormikProvider } from '../../../components/Form/Formik/Context'
import { sanitizeFormValues } from '../../../components/Form/Formik/Helpers'
import fetchWrapperForQueries from '../../../components/QueryFetch/index'
import { RESULT_DETAIL } from '../../../components/QueryFetch/Result'
import AspectButton from '../../../components/shared/AspectButton'
import useAuthState from '../../../hooks/useAuthState'
import COUNTRY_ISO_MAPPING from '../../../utils/consts/Countries/CONSTS'
import { getReturnUrl, gotoReturnUrl } from '../../../utils/utils/browser'
import { getTimezoneById } from '../../../utils/utils/timezone'
import { ResultDetailsErrors as customErrorNotifications } from './errors'
import messages from './messages'
import ResultTransferModal from './ResultTransferModal'
import { getFormConfigWithData, updateValidationsAndFilters } from './utils'

const AspectResultDetail = () => {
  const intl = useIntl()
  const navigate = useNavigate()
  const { resultId } = useParams()
  const location = useLocation()
  const [patientId, setPatientId] = useState()
  const [values, setValues] = useState(false)
  const [formConfig, setFormConfig] = useState(false)
  const [data, setData] = useState()

  const {
    data: queryResponse,
    isLoading,
    isError,
    error,
  } = useQuery([RESULT_DETAIL.KEY, { resultId }], async ({ queryKey: [, { resultId }] }) =>
    fetchWrapperForQueries({ endpoint: `${RESULT_DETAIL.ENDPOINT}/${resultId}`, customErrorNotifications })
  )

  if (isError) {
    throw new Error(error)
  }

  const { timezoneId } = useSelector(({ user }) => user)
  const validTimeZone = getTimezoneById(timezoneId)
  useEffect(() => {
    if (isLoading || !queryResponse) return
    if (queryResponse?.ok) {
      const { data } = queryResponse
      const timeOfTheTest = data.endedOn || data.startedOn
      data.startedOn = timeOfTheTest
        ? formatInTimeZone(new Date(timeOfTheTest), validTimeZone, 'yyyy-MM-dd  HH:mm')
        : 'N/A'
      data.patientId = data?.patientId && data?.patientId !== 'null' ? data?.patientId : 'N/A'
      /**
       * This field `allResistances` is displayed in `textArea` component in readOnly mode.
       * And because of that here we are joining array strings with `\n` symbol to make them
       * looking correct in textArea.
       */
      data.allResistances = trim(
        reduce(
          keys(data.resultData.allResistances),
          (acc, key) => {
            acc = [...acc, `${key}: ${startCase(data.resultData.allResistances[key])}`]
            return acc
          },
          []
        ).join('\n')
      )
      // This is for the title, so wee need the colons
      setPatientId(`: ${data.patientId}`)

      const config = getFormConfigWithData(intl, false, data)

      setData(data.customFields)

      setFormConfig(config)
      setValues(data)
    } else {
      throw new Error('Can not fetch data for result')
    }
  }, [isLoading, queryResponse, validTimeZone])

  const { mutate: submitResult } = useMutation(
    ({ values }) =>
      fetchWrapperForQueries({
        endpoint: `${RESULT_DETAIL.ENDPOINT}/${resultId}`,
        method: 'PUT',
        params: { ...values },
      }),
    { onSuccess: () => gotoReturnUrl(navigate, location, '/browse/result') }
  )

  return isLoading || !formConfig ? (
    <CircularProgress />
  ) : (
    <FormikProvider config={formConfig}>
      <DetailForm
        submitResult={submitResult}
        values={values}
        patientId={patientId}
        formConfig={formConfig}
        data={data}
      />
    </FormikProvider>
  )
}

const DetailForm = ({ values, patientId, formConfig, submitResult, data }) => {
  const intl = useIntl()
  const user = useAuthState()

  const [isTransferResultOpenOpen, setTransferResultOpen] = useState(false)
  const { setToggleEdit, formik, toggleEdit } = useFormikContext()
  const location = useLocation()

  const onSubmit = () => {
    const values = sanitizeFormValues(formik.values, { formConfig })
    submitResult({ values })
  }

  const keepInvalidSelection = !toggleEdit
  formConfig.sections = updateValidationsAndFilters(formConfig.sections, data, formik, keepInvalidSelection)
  return (
    <>
      <DetailHeader name={`${formConfig.title}${patientId}`} back={getReturnUrl(location, '/browse/result')}>
        {[
          {
            label: intl.formatMessage(messages.transferResult),
            onClick: () => setTransferResultOpen(true),
            disabled: toggleEdit,
          },
          {
            label: intl.formatMessage(messages.button_Edit),
            onClick: () => {
              setToggleEdit(true)
              setTimeout(
                () =>
                  document
                    .getElementById('customFields')
                    .scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' }),
                0
              )
            },
            disabled: toggleEdit,
            visible: !toggleEdit && user?.countryAbbreviation !== COUNTRY_ISO_MAPPING.NGA,
          },
          {
            label: intl.formatMessage(messages.button_Cancel),
            onClick: () => {
              formik.handleReset()
              setToggleEdit(false)
              setTimeout(
                () =>
                  document
                    .getElementById('site')
                    .scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' }),
                0
              )
            },
            disabled: !toggleEdit,
            visible: toggleEdit,
          },
          {
            label: intl.formatMessage(messages.button_Save),
            onClick: () => onSubmit(),
            disabled: !toggleEdit || !formik.dirty || !formik.isValid,
            visible: toggleEdit,
          },
        ].map(({ label, onClick, disabled = false, visible = true }) =>
          visible ? (
            <AspectButton
              key={label}
              onClick={onClick}
              disabled={disabled}
              color="primary"
              variant="contained"
              style={{ margin: '0 4px' }}
            >
              {label}
            </AspectButton>
          ) : null
        )}
      </DetailHeader>
      <Box component="main" sx={{ p: 1, width: '100%' }}>
        <Card>
          <CardContent>
            <AspectForm config={formConfig} />
          </CardContent>
        </Card>
        <ResultTransferModal
          data={values}
          isOpen={isTransferResultOpenOpen}
          onClose={() => setTransferResultOpen(false)}
        />
      </Box>
    </>
  )
}

export default AspectResultDetail
