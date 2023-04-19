import React from 'react'
import { Box, Button, Grid } from '@mui/material'
import { Formik } from 'formik'
import { useParams } from 'react-router-dom'
import { object, string } from 'yup'
import {
  AssaySelect,
  AssayTypeSelect,
  CountrySelect,
  DeviceTypeSelect,
  DiseaseSelect,
  JobSelect,
  LgaSelect,
  SiteSelect,
  StateSelect,
} from '../../cleanComponents'
import Loading from '../../cleanComponents/Loading'
import useCreatePersonAsignment from '../../hooks/person/useCreatePersonAsignment'
import useDeletePersonAsignment from '../../hooks/person/useDeletePersonAsignment'
import usePersonAssignment from '../../hooks/person/usePersonAssignment'
import useI18n from '../../hooks/useI18n'
import { getCustomMessage } from '../../messages'
import PersonAssignments from '../../oldPages/person/detail/PersonAssignments'
import { useAuthState } from '../../providers/AuthProvider'
import ContactStepper from './components/ContactStepper'
import ACTION from './constants'
import messages from './messages'

const JobAssigment = ({ setStep, id }) => {
  const { countryAbbreviation, countryId } = useAuthState()
  const { formatMessage } = useI18n()
  const { personId } = useParams()

  const { isLoading, data: assignment } = usePersonAssignment(personId)

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
  }

  const { mutate: deleteAssignment } = useDeletePersonAsignment(personId)
  const { mutate: createAssignment } = useCreatePersonAsignment(personId)

  const validationSchema = object({
    jobFunctionId: string().required(formatMessage(messages.jobRequired)),
  })

  return (
    <>
      <ContactStepper step={1} onChange={(v, step) => setStep(step)} isUpdate={id !== ACTION.ADD} full />
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
              } else if (k === 'assayId') {
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
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Grid item xs={12}>
                      <JobSelect
                        id="jobFunctionId"
                        name="jobFunctionId"
                        label={`${formatMessage(messages.job)} *`}
                        value={values.jobFunctionId}
                        onChange={handleChange}
                        error={errors.jobFunctionId ? errors.jobFunctionId : undefined}
                        helperText={errors.jobFunctionId}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <CountrySelect
                        id="countryId"
                        name="countryId"
                        label={formatMessage(messages.country)}
                        value={countryId}
                        onChange={handleChange}
                        error={errors.countryId ? errors.countryId : undefined}
                        helperText={errors.countryId}
                        disabled
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <StateSelect
                        id="stateId"
                        name="stateId"
                        label={getCustomMessage(messages, 'state', { countryAbbreviation })}
                        value={values.stateId || ''}
                        onChange={handleChange}
                        error={errors.stateId ? errors.stateId : undefined}
                        helperText={errors.stateId}
                        countryId={values.countryId}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <LgaSelect
                        id="lgaId"
                        name="lgaId"
                        label={getCustomMessage(messages, 'lga', { countryAbbreviation })}
                        value={values.lgaId || ''}
                        onChange={handleChange}
                        error={errors.lgaId ? errors.lgaId : undefined}
                        helperText={errors.lgaId}
                        stateId={values.stateId}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <SiteSelect
                        id="siteId"
                        name="siteId"
                        label={formatMessage(messages.site)}
                        value={values.siteId || ''}
                        onChange={handleChange}
                        error={errors.siteId ? errors.siteId : undefined}
                        helperText={errors.siteId}
                        stateId={values.stateId}
                        lgaId={values.lgaId}
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
                        error={errors.diseaseId ? errors.diseaseId : undefined}
                        helperText={errors.diseaseId}
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
                        error={errors.deviceTypeId ? errors.deviceTypeId : undefined}
                        helperText={errors.deviceTypeId}
                        disabled={values.diseaseId === ''}
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
                        error={errors.assayTypeId ? errors.assayTypeId : undefined}
                        helperText={errors.assayTypeId}
                        diseaseId={values.diseaseId}
                        disabled={values.deviceTypeId === ''}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <AssaySelect
                        id="assayId"
                        name="assayId"
                        label={formatMessage(messages.assay)}
                        value={values.assayId || ''}
                        onChange={handleChange}
                        error={errors.assayId ? errors.assayId : undefined}
                        helperText={errors.assayId}
                        assayTypeId={values.assayTypeId || ''}
                        deviceTypeId={values.deviceTypeId}
                        disabled={values.assayTypeId === ''}
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
                  <Button onClick={() => setStep(0)}>{formatMessage(messages.back)}</Button>
                  {dirty ? (
                    <Button type="submit" disabled={!isValid}>
                      {formatMessage(messages.addAssignment)}
                    </Button>
                  ) : null}
                  <Box sx={{ flex: '1 1 auto' }} />
                  {id === ACTION.ADD ? (
                    <Button onClick={() => setStep(2)}>{formatMessage(messages.next)}</Button>
                  ) : null}
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
