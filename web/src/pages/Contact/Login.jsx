import React from 'react'
import { Grid, Box, Button, TextField, FormControlLabel, Checkbox } from '@mui/material'
import { Formik } from 'formik'
import isEmpty from 'lodash/isEmpty'
import { useNavigate } from 'react-router-dom'
import { string, object, ref } from 'yup'
import { LabeledSwitch, InputPassword } from '../../cleanComponents'
import Loading from '../../components/Loading'
import usePerson from '../../hooks/person/usePerson'
import useUpdatePersonLogin from '../../hooks/person/useUpdatePersonLogin'
import useI18n from '../../hooks/useI18n'
import { useAuthState } from '../../providers/AuthProvider'
import ContactStepper from './components/ContactStepper'
import ACTION from './constants'
import messages from './messages'

const Login = ({ setStep, id }) => {
  const { formatMessage } = useI18n()
  const navigate = useNavigate()
  const { isLoading, data: person } = usePerson(id)
  const { userId: loggedInUserId } = useAuthState()

  const initialValues = {
    canLogIn: person?.canLogIn,
    username: person?.username || '',
    newPassword: '',
    confirmNewPassword: '',
    userLockedOut: person?.userLockedOut || '',
  }

  const pwdValidation = string()
    .min(8, formatMessage(messages.passwordConditionsShouldFulfilled))
    .matches(/(?=.*?[a-z])(?=.*?[A-Z])/, formatMessage(messages.passwordConditionsShouldFulfilled))
    .matches(/(?=.*?[`~!@#$%^&*()\-=_+\\[\]{}/?,.<>])/, formatMessage(messages.passwordConditionsShouldFulfilled))
    .matches(/\d/, formatMessage(messages.passwordConditionsShouldFulfilled))

  const validationSchema = object({
    canLogIn: id === ACTION.SELF ? string().nullable() : string().required(formatMessage(messages.required)),
    username: string().required(formatMessage(messages.usernameRequired)),
    newPassword:
      id === ACTION.ADD ? pwdValidation.required(formatMessage(messages.confirmNewPasswordRequired)) : pwdValidation,
    confirmNewPassword: string().when('newPassword', {
      is: val => !isEmpty(val),
      then: pwdValidation
        .required(formatMessage(messages.confirmNewPasswordRequired))
        .oneOf([ref('newPassword')], formatMessage(messages.confirmNewPasswordMatch)),
      otherwise: string().nullable(),
    }),
    userLockedOut: string().nullable(),
  })

  const { mutate: updateLogin } = useUpdatePersonLogin(id === ACTION.SELF ? loggedInUserId : id)

  return (
    <>
      <ContactStepper
        step={2}
        full={id !== ACTION.SELF}
        isUpdate={id !== ACTION.ADD}
        onChange={(v, step) => setStep(step)}
      />
      {isLoading ? (
        <Loading />
      ) : (
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={values => {
            updateLogin(
              {
                newUsername: values.username,
                newPassword: values.newPassword,
                userLockedOut: values.userLockedOut === 1,
              },
              {
                onSuccess: () => {
                  if (id === ACTION.ADD) {
                    setStep(2)
                  }
                },
              }
            )
          }}
        >
          {({ handleSubmit, handleChange, values, errors, isValid, dirty }) => (
            <>
              <form onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          id="canLogIn"
                          name="canLogIn"
                          checked={values.canLogIn === 1}
                          onChange={e => {
                            const { checked } = e.target
                            if (!checked)
                              updateLogin({
                                newUsername: values.username,
                                newPassword: values.newPassword,
                                userLockedOut: true,
                              })
                            handleChange({ target: { name: 'canLogIn', value: checked ? 1 : 0 } })
                          }}
                          error={errors.canLogIn ? errors.canLogIn : undefined}
                          helperText={errors.canLogIn}
                        />
                      }
                      label={`${formatMessage(messages.userCanAlsoLogIn)} *`}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      id="username"
                      name="username"
                      disabled={values.canLogIn !== 1}
                      label={`${formatMessage(messages.username)} *`}
                      value={values.username}
                      onChange={handleChange}
                      error={errors.username ? errors.username : undefined}
                      helperText={errors.username}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    {id !== ACTION.SELF ? (
                      <LabeledSwitch
                        id="userLockedOut"
                        name="userLockedOut"
                        disabled={values.canLogIn !== 1}
                        label={`${formatMessage(messages.userLockedOut)} *`}
                        value={values.userLockedOut === 1}
                        onChange={e =>
                          handleChange({ target: { name: 'userLockedOut', value: e.target.checked ? 1 : 0 } })
                        }
                        error={errors.userLockedOut ? errors.userLockedOut : undefined}
                        helperText={errors.userLockedOut}
                        onLabel={formatMessage(messages.locked)}
                        offLabel={formatMessage(messages.unlocked)}
                      />
                    ) : null}
                  </Grid>
                  <Grid item xs={6}>
                    <InputPassword
                      id="newPassword"
                      name="newPassword"
                      disabled={values.canLogIn !== 1}
                      label={`${formatMessage(messages.newPassword)}`}
                      value={values.newPassword}
                      onChange={handleChange}
                      error={errors.newPassword ? errors.newPassword : undefined}
                      helperText={errors.newPassword}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <InputPassword
                      id="confirmNewPassword"
                      name="confirmNewPassword"
                      disabled={values.canLogIn !== 1}
                      label={`${formatMessage(messages.confirmNewPassword)}`}
                      value={values.confirmNewPassword}
                      onChange={handleChange}
                      error={errors.confirmNewPassword ? errors.confirmNewPassword : undefined}
                      helperText={errors.confirmNewPassword || undefined}
                    />
                  </Grid>
                </Grid>
                <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
                  {id === ACTION.ADD ? (
                    <Button onClick={() => setStep(1)}>{formatMessage(messages.back)}</Button>
                  ) : null}

                  <Box sx={{ flex: '1 1 auto' }} />
                  {dirty ? (
                    <Button type="submit" disabled={!isValid}>
                      {formatMessage(messages.save)}
                    </Button>
                  ) : (
                    <Button onClick={() => navigate('/browse/person')}>{formatMessage(messages.next)}</Button>
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
