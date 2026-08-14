import React, { useContext } from 'react'
import { Box, Button, Checkbox, FormControlLabel, Grid, TextField } from '@mui/material'
import { Formik } from 'formik'
import isEmpty from 'lodash/isEmpty'
import { useIntl } from 'react-intl'
import { useNavigate, useLocation } from 'react-router-dom'
import { object, ref, string } from 'yup'
import { InputPassword, LabeledSwitch, Loading } from '../../components'
import useUpdateOwnLoginDetails from '../../hooks/auth/useUpdateOwnLoginDetails'
import usePerson from '../../hooks/person/usePerson'
import useUpdatePersonLogin from '../../hooks/person/useUpdatePersonLogin'
import useAuthState from '../../hooks/useAuthState'
import { gotoReturnUrl } from '../../utils/utils/browser'
import ContactStepper from './components/ContactStepper'
import ACTION from './constants'
import { DirtyListener, FormStatusContext } from './context'
import styles from './Login.module.css'
import messages from './messages'

const SectionDivider = ({ label }) => (
  <div className={styles.sectionDivider}>
    <span className={styles.sectionDivider__label}>{label}</span>
    <span className={styles.sectionDivider__line} />
  </div>
)

const Login = ({ setStep }) => {
  const { id, isAdding } = useContext(FormStatusContext)
  const { formatMessage } = useIntl()
  const navigate = useNavigate()
  const location = useLocation()
  const { isLoading, data: person } = usePerson(id)
  const { personId: loggedInPersonId, userPermissions } = useAuthState()
  const isSelf = id === ACTION.SELF
  const initialValues = {
    canLogIn: isSelf ? 1 : person?.canLogIn,
    username: person?.username || '',
    newPassword: '',
    confirmNewPassword: '',
    currentPassword: '',
    userLockedOut: person?.userLockedOut || '',
  }

  const pwdValidation = string()
    .min(8, formatMessage(messages.passwordConditionsShouldFulfilled))
    .matches(/(?=.*?[a-z])(?=.*?[A-Z])/, formatMessage(messages.passwordConditionsShouldFulfilled))
    .matches(/(?=.*?[`~!@#$%^&*()\-=_+\\[\]{}/?,.<>])/, formatMessage(messages.passwordConditionsShouldFulfilled))
    .matches(/\d/, formatMessage(messages.passwordConditionsShouldFulfilled))

  const validationSchema = object({
    username: string().required(formatMessage(messages.usernameRequired)),
    newPassword:
      isAdding || !person?.username
        ? pwdValidation.required(formatMessage(messages.confirmNewPasswordRequired))
        : pwdValidation,
    confirmNewPassword: string().when('newPassword', {
      is: val => !isEmpty(val),
      then: pwdValidation
        .required(formatMessage(messages.confirmNewPasswordRequired))
        .oneOf([ref('newPassword')], formatMessage(messages.confirmNewPasswordMatch)),
      otherwise: string().nullable(),
    }),
    currentPassword: isSelf ? string().required(formatMessage(messages.currentPasswordRequired)) : string().nullable(),
    userLockedOut: string().nullable(),
  })

  const { mutate: updatePersonLogin, isLoading: isUpdatingPerson } = useUpdatePersonLogin(
    isSelf ? loggedInPersonId : id
  )
  const { mutate: updateOwnLogin, isLoading: isUpdatingOwn } = useUpdateOwnLoginDetails(loggedInPersonId)
  const isUpdating = isUpdatingPerson || isUpdatingOwn

  const submitLoginUpdate = (values, resetForm) => {
    if (isSelf) {
      updateOwnLogin(
        {
          currentPassword: values.currentPassword,
          newUsername: values.username,
          newPassword: values.newPassword,
        },
        {
          onSuccess: () => {
            resetForm({ values: { ...values, newPassword: '', confirmNewPassword: '', currentPassword: '' } })
          },
        }
      )
      return
    }

    updatePersonLogin(
      {
        canLogIn: !!values.canLogIn,
        newUsername: values.username,
        newPassword: values.newPassword,
        userLockedOut: values.userLockedOut === 1,
      },
      {
        onSuccess: () => {
          resetForm({ values })
          if (isAdding) {
            setStep(2)
          }
        },
      }
    )
  }

  return (
    <>
      <ContactStepper
        step={2}
        full={!isSelf && userPermissions.includes('person:edit')}
        isUpdate={id !== ACTION.ADD}
        onChange={(v, step) => setStep(+step)}
      />
      {isLoading ? (
        <Loading />
      ) : (
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={(values, { resetForm }) => submitLoginUpdate(values, resetForm)}
        >
          {({ handleSubmit, handleChange, values: { canLogIn, ...values }, errors, isValid, dirty }) => (
            <>
              <DirtyListener step={2} />
              <form onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <SectionDivider label={formatMessage(messages.sectionOverview)} />
                  </Grid>
                  {!isSelf ? (
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            id="canLogIn"
                            name="canLogIn"
                            checked={canLogIn === 1}
                            onChange={e => {
                              const { checked } = e.target
                              handleChange({ target: { name: 'canLogIn', value: checked ? 1 : 0 } })
                            }}
                          />
                        }
                        label={`${formatMessage(messages.userCanAlsoLogIn)} *`}
                      />
                    </Grid>
                  ) : null}
                  <Grid item xs={6}>
                    <TextField
                      id="username"
                      name="username"
                      disabled={canLogIn !== 1}
                      label={`${formatMessage(messages.username)} *`}
                      value={values.username}
                      onChange={handleChange}
                      error={!!errors.username}
                      helperText={errors.username}
                    />
                  </Grid>
                  {!isSelf ? (
                    <Grid item xs={6}>
                      <LabeledSwitch
                        id="userLockedOut"
                        name="userLockedOut"
                        disabled={canLogIn !== 1}
                        label={`${formatMessage(messages.userLockedOut)} *`}
                        value={values.userLockedOut === 1}
                        onChange={e =>
                          handleChange({ target: { name: 'userLockedOut', value: e.target.checked ? 1 : 0 } })
                        }
                        error={!!errors.userLockedOut}
                        helperText={errors.userLockedOut}
                        onLabel={formatMessage(messages.locked)}
                        offLabel={formatMessage(messages.unlocked)}
                      />
                    </Grid>
                  ) : null}

                  <Grid item xs={12}>
                    <SectionDivider label={formatMessage(messages.sectionPasswordChange)} />
                  </Grid>
                  {isSelf ? (
                    <Grid item xs={12} md={6}>
                      <TextField
                        id="currentPassword"
                        name="currentPassword"
                        fullWidth
                        type="password"
                        label={`${formatMessage(messages.currentPassword)} *`}
                        value={values.currentPassword}
                        onChange={handleChange}
                        disabled={isUpdating}
                        error={!!errors.currentPassword}
                        helperText={errors.currentPassword}
                        inputProps={{ maxLength: 100, autoComplete: 'current-password' }}
                      />
                    </Grid>
                  ) : null}
                  <Grid item xs={12} md={6}>
                    <InputPassword
                      id="newPassword"
                      name="newPassword"
                      disabled={canLogIn !== 1}
                      label={`${formatMessage(messages.newPassword)}`}
                      value={values.newPassword}
                      onChange={handleChange}
                      error={!!errors.newPassword}
                      helperText={errors.newPassword}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <InputPassword
                      id="confirmNewPassword"
                      name="confirmNewPassword"
                      disabled={canLogIn !== 1}
                      label={`${formatMessage(messages.confirmNewPassword)}`}
                      value={values.confirmNewPassword}
                      onChange={handleChange}
                      error={!!errors.confirmNewPassword}
                      helperText={errors.confirmNewPassword || undefined}
                    />
                  </Grid>
                </Grid>
                <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
                  {isAdding ? <Button onClick={() => setStep(1)}>{formatMessage(messages.back)}</Button> : null}

                  <Box sx={{ flex: '1 1 auto' }} />
                  {dirty ? (
                    <Button type="submit" disabled={!isValid || isUpdating}>
                      {formatMessage(messages.save)}
                    </Button>
                  ) : (
                    <Button onClick={() => gotoReturnUrl(navigate, location, '/browse/person')}>
                      {formatMessage(messages.backToTable)}
                    </Button>
                  )}
                </Box>
              </form>
            </>
          )}
        </Formik>
      )}
    </>
  )
}

export default Login
