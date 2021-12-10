import React, { useState, useEffect } from 'react'
import { Formik, Form, Field } from 'formik'
import * as yup from 'yup'
import map from 'lodash/map'
import isEqual from 'lodash/isEqual'
import startCase from 'lodash/startCase'
import classnames from 'classnames/bind'
import TextField from '@material-ui/core/TextField'
import { isEmpty } from 'underscore'

// const cssClasses = classnames.bind(styles)

export function getInitialValues(items, forceInitialValues) {
  const values = {}
  if (forceInitialValues || process.env.NODE_ENV === 'development') {
    map(items, item => {
      const { id, initialValue } = item
      return (values[id] = initialValue)
    })
  }
  return values
}

export function getInitialValueKeys(items) {
  const values = {}
  map(items, ({ id }) => (values[id] = ''))
  return values
}

export function getValidation(items) {
  const output = {}
  map(items, ({ id, validation }) => (output[id] = validation))
  return output
}

const PureTextInput = props => {
  const { inputProps, form } = props
  const { id, label, type } = inputProps
  const { errors, touched, handleChange, values } = form
  return (
    <TextField
      fullWidth
      id={id}
      name={id}
      label={label || startCase(id)}
      type={type}
      variant="standard"
      value={values[id]}
      onChange={handleChange}
      error={touched[id] && Boolean(errors[id])}
      helperText={touched[id] && errors[id]}
    />
  )
}

const itemsConfig = {
  items: [
    {
      id: 'name',
      label: 'Name',
      type: 'text',
      component: PureTextInput,
      validation: yup.string().required('Required'),
    },
    {
      id: 'email',
      label: 'Primary Email',
      type: 'email',
      component: PureTextInput,
      validation: yup.string().email('Invalid email').required('Required'),
    },
    // {
    //   id: 'email2',
    //   label: 'Secondary Email',
    //   type: 'email',
    //   component: PureTextInput,
    //   validation: yup.string().when('email', {
    //     is: val => !isEmpty(val),
    //     then: yup.string().email('Invalid email').required('Required'),
    //   }),
    // },
    // {id: 'title', name: 'title', type: 'text', component: , initialValue: ,}
    // {id: 'email', name: 'email', type: 'text', component: , initialValue: ,}
    // {id: 'email2', name: 'email2', type: 'text', component: , initialValue: ,}
    // {id: 'phone', name: 'phone', type: 'text', component: , initialValue: ,}
    // {id: 'cell', name: 'cell', type: 'text', component: , initialValue: ,}
    // {id: 'lastPartnerId', name: 'lastPartnerId', type: 'text', component: , initialValue: ,}
    // {id: 'country', name: 'country', type: 'text', component: , initialValue: ,}
    // {id: 'countryId', name: 'countryId', type: 'text', component: , initialValue: ,}
    // {id: 'stateId', name: 'stateId', type: 'text', component: , initialValue: ,}
    // {id: 'lgaId', name: 'lgaId', type: 'text', component: , initialValue: ,}
    // {id: 'zip', name: 'zip', type: 'text', component: , initialValue: ,}
    // {id: 'notes', name: 'notes', type: 'text', component: , initialValue: ,}
    // {id: 'canLogIn', name: 'canLogIn', type: 'text', component: , initialValue: ,}
    // {id: 'userId', name: 'userId', type: 'text', component: , initialValue: ,}
    // {id: 'timezone', name: 'timezone', type: 'text', component: , initialValue: ,}
    // {id: 'culture', name: 'culture', type: 'text', component: , initialValue: ,}
  ],
}

const ContactDetailsFormFormik = ({ data }) => {
  const { contactDetails, userPreferences, loading } = data
  const [config, setConfig] = useState(false)

  useEffect(() => {
    if (!loading) {
      console.log(loading, contactDetails.toJS(), userPreferences.toJS())
      const newConfig = {
        id: 'contact-update',
        rows: [itemsConfig],
        initialValues: {
          ...getInitialValues(itemsConfig.items, false),
          ...contactDetails.toJS(),
        },
        // {
        // name: '',
        // title: '',
        // email: '',
        // email2: '',
        // phone: '',
        // cell: '',
        // lastPartnerId: '',
        // country: '',
        // countryId: '',
        // stateId: '',
        // lgaId: '',
        // zip: '',
        // notes: '',
        // canLogIn: '',
        // userId: '',
        // timezone: '',
        // culture: '',
        // },
      }

      if (!isEqual(config, newConfig)) {
        setConfig(newConfig)
      }
    }
  }, [loading])

  // const validation = getValidation(itemsConfig.items)
  const validation = yup.object().shape({
    name: yup.string().required('Required'),
    email: yup.string().email('Invalid email').required('Required'),
  })
  console.log(validation)

  return config ? (
    <Formik
      initialValues={config?.initialValues}
      validationSchema={validation}
      onSubmit={(values, { setSubmitting }) => {
        setTimeout(() => {
          console.log(JSON.stringify(values, null, 2))
          setSubmitting(false)
        }, 0)
      }}
    >
      {({
        values,
        errors,
        touched,
        handleChange,
        handleBlur,
        handleSubmit,
        isSubmitting,
      }) => (
        <Form>
          {map(config?.rows, ({ items }, index) => (
            <div key={`${config?.id}-row${index}`} className="form__row">
              {map(items, ({ component: Input, ...input }) => (
                <Field
                  key={`${config?.id}-row${index}-${input?.id}`}
                  name={input?.id}
                  inputProps={input}
                  component={Input}
                />
              ))}
            </div>
          ))}
          {/* <Field name="firstName" />
          {errors.firstName && touched.firstName ? (
            <div>{errors.firstName}</div>
          ) : null} */}
          <button type="submit">Submit</button>
        </Form>
      )}
    </Formik>
  ) : (
    <div>loading</div>
  )
}

export default ContactDetailsFormFormik
