import React from 'react'
import { Grid, Box, Button, TextField } from '@mui/material'
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

const ContactPageStepTwo = ({ setStep, id }) => {
  const { formatMessage } = useI18n()
  const navigate = useNavigate()
  const { isLoading, data: person } = usePerson(id)
  const { userId: loggedInUserId } = useAuthState()

  const initialValues = {
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
      <ContactStepper step={1} full={id !== ACTION.SELF} />
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
                  if (id !== ACTION.SELF) {
                    setStep(2)
                  } else {
                    navigate('/browse/person')
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
                  <Grid item xs={6}>
                    <TextField
                      id="username"
                      name="username"
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
                      label={`${formatMessage(messages.confirmNewPassword)}`}
                      value={values.confirmNewPassword}
                      onChange={handleChange}
                      error={errors.confirmNewPassword ? errors.confirmNewPassword : undefined}
                      helperText={errors.confirmNewPassword || undefined}
                    />
                  </Grid>
                </Grid>
                <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
                  <Button onClick={() => setStep(0)}>{formatMessage(messages.back)}</Button>
                  <Box sx={{ flex: '1 1 auto' }} />
                  {dirty ? (
                    <Button type="submit" disabled={!isValid}>
                      {id !== ACTION.SELF ? formatMessage(messages.saveAndNext) : formatMessage(messages.saveAndTable)}
                    </Button>
                  ) : id !== ACTION.SELF ? (
                    <Button disabled={id === ACTION.ADD} onClick={() => setStep(2)}>
                      {formatMessage(messages.next)}
                    </Button>
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

export default ContactPageStepTwo
