import React, { useContext, useState } from 'react'
import { Box, Button, Grid } from '@mui/material'
import { Formik } from 'formik'
import { useIntl } from 'react-intl'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { object, string } from 'yup'
import {
  AssaySelect,
  AssayTypeSelect,
  CountrySelect,
  DeviceTypeSelect,
  DiseaseSelect,
  JobSelect,
  LgaSelect,
  Loading,
  SiteSelect,
  StateSelect,
  TagSingleSelect,
} from '../../components'
import useCreatePersonAsignment from '../../hooks/person/useCreatePersonAsignment'
import useDeletePersonAsignment from '../../hooks/person/useDeletePersonAsignment'
import usePersonAssignment from '../../hooks/person/usePersonAssignment'
import useAuthState from '../../hooks/useAuthState'
import { getCustomMessage } from '../../messages'
import PersonAssignments from '../../oldPages/person/detail/PersonAssignments'
import { gotoReturnUrl } from '../../utils/utils/browser'
import ContactStepper from './components/ContactStepper'
import ACTION from './constants'
import { DirtyListener, FormStatusContext } from './context'
import messages from './messages'

const JobAssigment = ({ setStep }) => {
  const { id, isAdding } = useContext(FormStatusContext)
  const auth = useAuthState()
  const { countryAbbreviation, countryId } = auth
  const { formatMessage } = useIntl()
  const { personId = auth.personId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { isLoading, data: assignment } = usePersonAssignment(personId)
  const [disableConstraints, setDisableConstraints] = useState(true)

  const initialValues = {
    jobFunctionId: '',
    countryId,
    stateId: '',
    lgaId: '',
    siteId: '',
    diseaseId: '',
    deviceTypeId: '',
    assayTypeId: '',
    assayId: '',
    tagId: '',
  }

  const { mutate: deleteAssignment } = useDeletePersonAsignment(personId)
  const { mutate: createAssignment } = useCreatePersonAsignment(personId)

  const validationSchema = object({
    jobFunctionId: string().required(formatMessage(messages.jobRequired)),
  })

  const handleJobFunctionChange = handleChange => {
    return data => {
      // Clear all the form except jobFunctionId
      Object.keys(initialValues)
        .filter(key => key !== 'jobFunctionId')
        .forEach(key => {
          const initialValue = initialValues[key]
          handleChange({ target: { name: key, value: initialValue } })
        })
      // Update jobFunctionId
      handleChange(data)
    }
  }

  return (
    <>
      <ContactStepper step={1} onChange={(v, step) => setStep(+step)} isUpdate={id !== ACTION.ADD} full />
      {isLoading ? (
        <Loading />
      ) : (
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={(values, { resetForm }) => {
            const data = { ...values, personId }
            Object.keys(data).map(k => {
              if (data[k] === '') {
                data[k] = undefined
              } else if (k === 'assayId' || k === 'tagId') {
                data[k] = +data[k]
              }
              return k
            })

            createAssignment(data)
            resetForm()
          }}
        >
          {({ handleSubmit, handleChange, values, errors, isValid, dirty }) => (
            <>
              <form onSubmit={handleSubmit}>
                <DirtyListener step={1} />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Grid item xs={12}>
                      <JobSelect
                        id="jobFunctionId"
                        name="jobFunctionId"
                        label={`${formatMessage(messages.job)} *`}
                        value={values.jobFunctionId}
                        onChange={handleJobFunctionChange(handleChange)}
                        error={!!errors.jobFunctionId}
                        helperText={errors.jobFunctionId}
                        setDisableConstraints={setDisableConstraints}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <CountrySelect
                        id="countryId"
                        name="countryId"
                        label={formatMessage(messages.country)}
                        value={countryId}
                        onChange={handleChange}
                        error={!!errors.countryId}
                        helperText={errors.countryId}
                        disabled
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <StateSelect
                        id="stateId"
                        name="stateId"
                        label={getCustomMessage(formatMessage, messages, 'state', { countryAbbreviation })}
                        value={values.stateId || ''}
                        onChange={handleChange}
                        error={!!errors.stateId}
                        helperText={errors.stateId}
                        countryId={values.countryId}
                        disabled={disableConstraints}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <LgaSelect
                        id="lgaId"
                        name="lgaId"
                        label={getCustomMessage(formatMessage, messages, 'lga', { countryAbbreviation })}
                        value={values.lgaId || ''}
                        onChange={handleChange}
                        error={!!errors.lgaId}
                        helperText={errors.lgaId}
                        stateId={values.stateId}
                        disabled={disableConstraints}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <SiteSelect
                        id="siteId"
                        name="siteId"
                        label={formatMessage(messages.site)}
                        value={values.siteId || ''}
                        onChange={handleChange}
                        error={!!errors.siteId}
                        helperText={errors.siteId}
                        stateId={values.stateId}
                        lgaId={values.lgaId}
                        disabled={disableConstraints}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <DiseaseSelect
                        id="diseaseId"
                        name="diseaseId"
                        label={formatMessage(messages.disease)}
                        value={values.diseaseId || ''}
                        onChange={value => {
                          handleChange({ target: { name: 'diseaseId', value } })
                          if (value === '') {
                            handleChange({ target: { name: 'deviceTypeId', value } })
                            handleChange({ target: { name: 'assayTypeId', value } })
                            handleChange({ target: { name: 'assayId', value } })
                          }
                        }}
                        error={!!errors.diseaseId}
                        helperText={errors.diseaseId}
                        disabled={disableConstraints}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <DeviceTypeSelect
                        id="deviceTypeId"
                        name="deviceTypeId"
                        label={formatMessage(messages.deviceType)}
                        value={values.deviceTypeId || ''}
                        onChange={value => {
                          handleChange({ target: { name: 'deviceTypeId', value } })
                          if (value === '') {
                            handleChange({ target: { name: 'assayTypeId', value } })
                            handleChange({ target: { name: 'assayId', value } })
                          }
                        }}
                        error={!!errors.deviceTypeId}
                        helperText={errors.deviceTypeId}
                        disabled={values.diseaseId === '' || disableConstraints}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <AssayTypeSelect
                        id="assayTypeId"
                        name="assayTypeId"
                        label={formatMessage(messages.assayType)}
                        value={values.assayTypeId || ''}
                        onChange={value => {
                          handleChange({ target: { name: 'assayTypeId', value } })
                          if (value === '') {
                            handleChange({ target: { name: 'assayId', value } })
                          }
                        }}
                        error={!!errors.assayTypeId}
                        helperText={errors.assayTypeId}
                        diseaseId={values.diseaseId}
                        disabled={values.deviceTypeId === '' || disableConstraints}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <AssaySelect
                        id="assayId"
                        name="assayId"
                        label={formatMessage(messages.assay)}
                        value={values.assayId || ''}
                        onChange={handleChange}
                        error={!!errors.assayId}
                        helperText={errors.assayId}
                        assayTypeId={values.assayTypeId || ''}
                        deviceTypeId={values.deviceTypeId}
                        disabled={values.assayTypeId === '' || disableConstraints}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TagSingleSelect
                        type="site"
                        id="tagId"
                        name="tagId"
                        label={formatMessage(messages.restrictToSitesWithTag)}
                        error={!!errors.tagId}
                        value={values.tagId || ''}
                        helperText={errors.tagId}
                        onChange={handleChange}
                        disabled={values.jobFunctionId === '' || disableConstraints}
                      />
                    </Grid>
                  </Grid>
                  <Grid item xs={6}>
                    <PersonAssignments
                      assignments={assignment}
                      loadedAssignments
                      onDeleteAssignment={deleteAssignment}
                    />
                  </Grid>
                </Grid>
                <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
                  <Button onClick={() => (isAdding ? setStep(0) : gotoReturnUrl(navigate, location, '/browse/person'))}>
                    {formatMessage(messages[isAdding ? 'back' : 'backToTable'])}
                  </Button>
                  {dirty ? (
                    <Button type="submit" disabled={!isValid}>
                      {formatMessage(messages.addAssignment)}
                    </Button>
                  ) : null}
                  <Box sx={{ flex: '1 1 auto' }} />
                  {isAdding ? <Button onClick={() => setStep(2)}>{formatMessage(messages.next)}</Button> : null}
                </Box>
              </form>
            </>
          )}
        </Formik>
      )}
    </>
  )
}

export default JobAssigment
