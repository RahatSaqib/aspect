import React, { useContext } from 'react'
import { Box, Button, Grid, TextField } from '@mui/material'
import { Formik } from 'formik'
import isString from 'lodash/isString'
import MuiPhoneNumber from 'material-ui-phone-number'
import { useNavigate } from 'react-router-dom'
import { array, object, string } from 'yup'
import {
  CountrySelect,
  LanguageSelect,
  LgaSelect,
  PartnerSelect,
  StateSelect,
  TagSelect,
  TimezoneSelect,
} from '../../cleanComponents'
import Loading from '../../cleanComponents/Loading'
import useAddPerson from '../../hooks/person/useAddPerson'
import usePerson from '../../hooks/person/usePerson'
import useUpdatePerson from '../../hooks/person/useUpdatePerson'
import useUpdateSelf from '../../hooks/person/useUpdateSelf'
import useI18n from '../../hooks/useI18n'
import { getCustomMessage } from '../../messages/customMessages'
import { useAuthState } from '../../providers/AuthProvider'
import ContactStepper from './components/ContactStepper'
import ACTION from './constants'
import { DirtyListener, FormStatusContext } from './context'
import messages from './messages'

const ContactDetails = ({ setStep }) => {
  const navigate = useNavigate()

  const { isRecentlyAdd, isAdding, id } = useContext(FormStatusContext)

  const { countryAbbreviation, countryId } = useAuthState()
  const { formatMessage } = useI18n()

  const { isLoading, data: person } = usePerson(id)

  const validationSchema = object({
    // row 1
    name: string().required(formatMessage(messages.nameRequired)),
    title: string().nullable(),
    // row 2
    email: string().email(formatMessage(messages.invalidEmailAddress)).required(formatMessage(messages.emailRequired)),
    email2: string().email(formatMessage(messages.invalidEmailAddress)).nullable(),
    // row 3
    phone: string().nullable(),
    cell: string().nullable(),
    // row 4
    countryId: string().nullable(),
    stateId: string().nullable(),
    lgaId: string().nullable(),
    zip: string().nullable(),
    // row 5
    lastPartnerId: id === ACTION.SELF ? string().nullable() : string().required(formatMessage(messages.required)),
    // row 6
    timezone: string().nullable(),
    culture: string().nullable(),
    // row 7
    tags: array().nullable(),
    // row 8
    notes: string().nullable(),
  })

  if (person) {
    if (id === ACTION.ADD) {
      person.countryId = countryId
    }
    if (isString(person.tags)) {
      person.tags = person.tags.split(',')
    }
  }

  const { mutate: addPerson } = useAddPerson()
  const { mutate: updateSelf } = useUpdateSelf(id)
  const { mutate: updatePerson } = useUpdatePerson(id)

  return (
    <>
      <ContactStepper
        step={0}
        full={id !== ACTION.SELF}
        isUpdate={id !== ACTION.ADD}
        onChange={(v, step) => setStep(step)}
      />
      {isLoading ? (
        <Loading />
      ) : (
        <Formik
          initialValues={{
            ...person,
            email: person.email || '',
            phone: person.phone?.length > 5 ? person.phone : null,
            cell: person.cell?.length > 5 ? person.cell : null,
          }}
          validationSchema={validationSchema}
          onSubmit={(values, { resetForm }) => {
            const noField = [
              'country',
              'stateName',
              'lgaName',
              'disabled',
              'disabledOn',
              'jobId',
              'jobFunctions',
              'userId',
              'username',
              'userLockedOut',
              'canLogIn',
            ]
            values.tags = (values.tags || []).join(',')
            noField.map(f => delete values[f])
            if (id === ACTION.ADD) {
              addPerson(values, {
                onSuccess: ({ data }) => {
                  navigate(`/browse/person/${data.id}?add=true`)
                  setStep(1)
                  resetForm({ values })
                },
              })
            } else if (id === ACTION.SELF) {
              updateSelf(values, { onSuccess: () => resetForm({ values }) })
            } else {
              updatePerson(values, {
                onSuccess: () => {
                  resetForm({ values })
                  if (isRecentlyAdd) setStep(1)
                },
              })
            }
          }}
        >
          {({ handleSubmit, handleChange, values, errors, isValid, dirty }) => (
            <form onSubmit={handleSubmit}>
              <DirtyListener step={0} />
              <Grid container spacing={2}>
                {/* row0 */}

                {/* row1 */}
                <Grid item xs={6}>
                  <TextField
                    id="name"
                    name="name"
                    label={`${formatMessage(messages.fullName)} *`}
                    value={values.name}
                    onChange={handleChange}
                    error={errors.name ? errors.name : undefined}
                    helperText={errors.name}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    id="title"
                    name="title"
                    label={formatMessage(messages.jobTitle)}
                    value={values.title}
                    onChange={handleChange}
                    error={errors.title ? errors.title : undefined}
                    helperText={errors.title}
                  />
                </Grid>
                {/* row2 */}
                <Grid item xs={6}>
                  <TextField
                    id="email"
                    name="email"
                    type="email"
                    label={`${formatMessage(messages.primaryEmail)} *`}
                    value={values.email}
                    onChange={handleChange}
                    error={errors.email ? errors.email : undefined}
                    helperText={errors.email}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    id="email2"
                    name="email2"
                    type="email"
                    label={formatMessage(messages.secondaryEmail)}
                    value={values.email2}
                    onChange={handleChange}
                    error={errors.email2 ? errors.email2 : undefined}
                    helperText={errors.email2}
                  />
                </Grid>
                {/* row3 */}
                <Grid item xs={6}>
                  <MuiPhoneNumber
                    id="phone"
                    name="phone"
                    defaultCountry="us"
                    label={formatMessage(messages.phone)}
                    value={values.phone || '+1'}
                    onChange={e => {
                      handleChange({ target: { name: 'phone', value: e !== '+' && e !== '+1' ? e : null } })
                    }}
                    error={errors.phone ? errors.phone : undefined}
                    helperText={errors.phone}
                  />
                </Grid>
                <Grid item xs={6}>
                  <MuiPhoneNumber
                    id="cell"
                    name="cell"
                    defaultCountry="us"
                    label={formatMessage(messages.mobile)}
                    value={values.cell || '+1'}
                    onChange={e => {
                      handleChange({ target: { name: 'cell', value: e !== '+' && e !== '+1' ? e : null } })
                    }}
                    error={errors.cell ? errors.cell : undefined}
                    helperText={errors.cell}
                  />
                </Grid>
                {/* row4 */}
                <Grid item xs={3}>
                  <CountrySelect
                    id="countryId"
                    name="countryId"
                    label={formatMessage(messages.country)}
                    value={values.countryId}
                    onChange={handleChange}
                    error={errors.countryId ? errors.countryId : undefined}
                    helperText={errors.countryId}
                  />
                </Grid>
                <Grid item xs={3}>
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
                <Grid item xs={3}>
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
                <Grid item xs={3}>
                  <TextField
                    id="zip"
                    name="zip"
                    label={formatMessage(messages.zip)}
                    value={values.zip}
                    onChange={handleChange}
                    error={errors.zip ? errors.zip : undefined}
                    helperText={errors.zip}
                  />
                </Grid>
                {/* row5 */}
                {id !== ACTION.SELF ? (
                  <Grid item xs={12}>
                    <PartnerSelect
                      id="lastPartnerId"
                      name="lastPartnerId"
                      label={`${formatMessage(messages.partner)} *`}
                      value={values.lastPartnerId}
                      onChange={handleChange}
                      error={errors.lastPartnerId ? errors.lastPartnerId : undefined}
                      helperText={errors.lastPartnerId}
                    />
                  </Grid>
                ) : null}
                {/* row6 */}
                <Grid item xs={6}>
                  <TimezoneSelect
                    id="timezone"
                    name="timezone"
                    label={formatMessage(messages.timezone)}
                    value={values.timezone}
                    onChange={handleChange}
                    error={errors.timezone ? errors.timezone : undefined}
                    helperText={errors.timezone}
                  />
                </Grid>
                <Grid item xs={6}>
                  <LanguageSelect
                    id="culture"
                    name="culture"
                    label={formatMessage(messages.language)}
                    value={values.culture}
                    onChange={handleChange}
                    error={errors.culture ? errors.culture : undefined}
                    helperText={errors.culture}
                  />
                </Grid>
                {/* row7 */}
                <Grid item xs={12}>
                  <TagSelect
                    id="tags"
                    name="tags"
                    label={formatMessage(messages.chooseTags)}
                    value={isString(values.tags) ? values.tags.split(',') : values.tags || []}
                    onChange={handleChange}
                    error={errors.tags ? errors.tags : undefined}
                    helperText={errors.tags}
                  />
                </Grid>
                {/* row8 */}
                {id !== ACTION.SELF ? (
                  <Grid item xs={12}>
                    <TextField
                      id="notes"
                      name="notes"
                      value={values.notes}
                      label={formatMessage(messages.notes)}
                      onChange={e => {
                        handleChange({ target: { name: 'notes', value: e.target.value } })
                      }}
                      error={errors.notes ? errors.notes : undefined}
                      helperText={errors.notes}
                      multiline
                      rows={3}
                    />
                  </Grid>
                ) : null}
              </Grid>
              <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
                <Button onClick={() => navigate(-1)}>{formatMessage(messages.backToTable)}</Button>
                <Box sx={{ flex: '1 1 auto' }} />
                {isRecentlyAdd && !dirty ? (
                  <Button onClick={() => setStep(1)}>{formatMessage(messages.next)}</Button>
                ) : dirty || isAdding ? (
                  <Button disabled={!isValid} type="submit">
                    {formatMessage(messages[isAdding ? 'saveAndNext' : 'save'])}
                  </Button>
                ) : null}
              </Box>
            </form>
          )}
        </Formik>
      )}
    </>
  )
}

export default ContactDetails
