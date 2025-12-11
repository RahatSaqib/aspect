import React, { useContext } from 'react'
import { Box, Button, Grid, TextField } from '@mui/material'
import { Formik } from 'formik'
import isString from 'lodash/isString'
import MuiPhoneNumber from 'material-ui-phone-number'
import { useIntl } from 'react-intl'
import { useLocation, useNavigate } from 'react-router-dom'
import { array, object, string } from 'yup'
import {
  CountrySelect,
  LanguageSelect,
  LgaSelect,
  Loading,
  PartnerSelect,
  StateSelect,
  TagSelect,
  TimezoneSelect,
} from '../../cleanComponents'
import useAddPerson from '../../hooks/person/useAddPerson'
import usePerson from '../../hooks/person/usePerson'
import useUpdatePerson from '../../hooks/person/useUpdatePerson'
import useUpdateSelf from '../../hooks/person/useUpdateSelf'
import useAuthState from '../../hooks/useAuthState'
import { getCustomMessage } from '../../messages/customMessages'
import { gotoReturnUrl } from '../../utils/utils/browser'
import { normalizePhoneNumber } from '../../utils/utils/phone'
import { getTimezoneById } from '../../utils/utils/timezone'
import ContactStepper from './components/ContactStepper'
import ACTION from './constants'
import { DirtyListener, FormStatusContext } from './context'
import messages from './messages'

const ContactDetails = ({ setStep }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const event = new Event('storage')

  const { isRecentlyAdd, isAdding, id } = useContext(FormStatusContext)

  const { countryAbbreviation, countryId, userPermissions, timezoneId } = useAuthState()
  const { formatMessage } = useIntl()

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
      person.timezone = timezoneId
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
        full={id !== ACTION.SELF && userPermissions.includes('person:edit')}
        isUpdate={id !== ACTION.ADD}
        onChange={(v, step) => setStep(+step)}
      />
      {isLoading ? (
        <Loading />
      ) : (
        <Formik
          initialValues={{
            ...person,
            email: person?.email || '',
            title: person?.title || '',
            email2: person?.email2 || '',
            stateId: person?.stateId || '',
            lgaId: person?.lgaId || '',
            notes: person?.notes || '',
            zip: person?.zip || '',
            phone: person?.phone?.length > 5 ? person.phone : null,
            cell: person?.cell?.length > 5 ? person.cell : null,
          }}
          validationSchema={validationSchema}
          onSubmit={(values, { resetForm, setSubmitting }) => {
            const noField = [
              'country',
              'stateName',
              'lgaName',
              'disabled',
              'disabledOn',
              'jobContextId',
              'jobFunctions',
              'userId',
              'username',
              'userLockedOut',
              'canLogIn',
            ]
            if (person.culture !== values.culture) localStorage.setItem('asCulture', values.culture)
            window.dispatchEvent(event) // Trigger the listener manually

            values.tags = (values.tags || []).join(',')
            noField.map(f => delete values[f])
            setSubmitting(true)
            if (id === ACTION.ADD) {
              addPerson(values, {
                onSettled: () => setSubmitting(false),
                onSuccess: ({ data }) => {
                  navigate(`/browse/person/${data.id}${location.search}${location.search ? '&' : '?'}add=true`)
                  setStep(1)
                  resetForm({ values })
                },
              })
            } else if (id === ACTION.SELF) {
              updateSelf(values, {
                onSettled: () => setSubmitting(false),
                onSuccess: () => {
                  localStorage.setItem('asTimezoneId', getTimezoneById(values.timezone))
                  resetForm({ values })
                },
              })
            } else {
              updatePerson(values, {
                onSettled: () => setSubmitting(false),
                onSuccess: () => {
                  resetForm({ values })
                  if (isRecentlyAdd) setStep(1)
                },
              })
            }
          }}
        >
          {({ handleSubmit, handleChange, setFieldValue, values, errors, isValid, isSubmitting, dirty }) => (
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
                    error={!!errors.name}
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
                    error={!!errors.title}
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
                    error={!!errors.email}
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
                    error={!!errors.email2}
                    helperText={errors.email2}
                  />
                </Grid>
                {/* row3 */}
                <Grid item xs={6}>
                  <MuiPhoneNumber
                    id="phone"
                    name="phone"
                    defaultCountry="us"
                    countryCodeEditable={false}
                    label={formatMessage(messages.phone)}
                    value={values.phone}
                    onChange={(e, c) => {
                      setFieldValue('phoneE164', normalizePhoneNumber(e, c?.countryCode))
                      handleChange({ target: { name: 'phone', value: e !== '+' && e !== '+1' ? e : null } })
                    }}
                    error={!!errors.phone}
                    helperText={errors.phone}
                  />
                </Grid>
                <Grid item xs={6}>
                  <MuiPhoneNumber
                    id="cell"
                    name="cell"
                    defaultCountry="us"
                    countryCodeEditable={false}
                    label={formatMessage(messages.mobile)}
                    value={values.cell}
                    onChange={(e, c) => {
                      setFieldValue('cellE164', normalizePhoneNumber(e, c?.countryCode))
                      handleChange({ target: { name: 'cell', value: e !== '+' && e !== '+1' ? e : null } })
                    }}
                    error={!!errors.cell}
                    helperText={errors.cell}
                  />
                </Grid>
                {/* row4 */}
                <Grid item xs={3}>
                  <CountrySelect
                    id="countryId"
                    name="countryId"
                    returnAll
                    label={formatMessage(messages.country)}
                    value={values.countryId}
                    onChange={e => {
                      setFieldValue('countryId', e.target.value)
                      setFieldValue('stateId', '')
                      setFieldValue('lgaId', '')
                    }}
                    error={!!errors.countryId}
                    helperText={errors.countryId}
                  />
                </Grid>
                <Grid item xs={3}>
                  <StateSelect
                    id="stateId"
                    name="stateId"
                    returnAll
                    label={getCustomMessage(formatMessage, messages, 'state', { countryAbbreviation })}
                    value={values.stateId || ''}
                    onChange={handleChange}
                    error={!!errors.stateId}
                    helperText={errors.stateId}
                    countryId={values.countryId}
                  />
                </Grid>
                <Grid item xs={3}>
                  <LgaSelect
                    id="lgaId"
                    name="lgaId"
                    returnAll
                    label={getCustomMessage(formatMessage, messages, 'lga', { countryAbbreviation })}
                    value={values.lgaId || ''}
                    onChange={handleChange}
                    error={!!errors.lgaId}
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
                    error={!!errors.zip}
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
                      error={!!errors.lastPartnerId}
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
                    disabled
                    error={!!errors.timezone}
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
                    error={!!errors.culture}
                    helperText={errors.culture}
                  />
                </Grid>
                {/* row7 */}
                <Grid item xs={12}>
                  <TagSelect
                    id="tags"
                    name="tags"
                    label={formatMessage(messages.notificationTags)}
                    value={isString(values.tags) ? values.tags.split(',') : values.tags || []}
                    onChange={handleChange}
                    error={!!errors.tags}
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
                      error={!!errors.notes}
                      helperText={errors.notes}
                      multiline
                      rows={3}
                    />
                  </Grid>
                ) : null}
              </Grid>
              <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
                <Button onClick={() => gotoReturnUrl(navigate, location, '/browse/person')}>
                  {formatMessage(messages.backToTable)}
                </Button>
                <Box sx={{ flex: '1 1 auto' }} />
                {isRecentlyAdd && !dirty ? (
                  <Button onClick={() => setStep(1)}>{formatMessage(messages.next)}</Button>
                ) : dirty || isAdding ? (
                  <Button disabled={!isValid || isSubmitting} type="submit">
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
