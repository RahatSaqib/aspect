import React from 'react'
import classnames from 'classnames/bind'
import { useFormik } from 'formik'

import Button from '@material-ui/core/Button'
import AspectInput from '../Inputs'

import {
  buildErrorMessage,
  createValidationSchema,
  buildLabel,
  pickKeys,
} from '../Helpers'

import DisplayFormikState from '../Helpers/debug'

import form from './mockedFormSchema'

const formCssClasses = classnames.bind(require('../Form.css'))

const DynamicSignup = intl => {
  const { fields, cancel, submit } = form
  const initialValues = pickKeys(fields, ['initialValue'])
  const validationSchema = createValidationSchema(fields, intl)

  const formik = useFormik({
    initialValues,
    validationSchema,
    validateOnMount: false,
    // onSubmit: this can be a dynamic redux action and database table can be passed along from schema
    onSubmit: values => console.log(JSON.stringify(values, null, 2)),
  })

  console.log(form)

  return (
    <div className={formCssClasses('form__container')}>
      <form
        onSubmit={formik.handleSubmit}
        className={formCssClasses('form__block')}
      >
        <div className={formCssClasses('form__row')}>
          {fields &&
            fields.map(
              ({
                id,
                classes,
                i18nLabel: label,
                type,
                controlType,
                validation = false,
              }) => {
                return (
                  <AspectInput
                    {...formik.getFieldProps(id)}
                    id={id}
                    type={type}
                    controlType={controlType}
                    label={buildLabel(label, validation)}
                    className={formCssClasses(...classes)}
                    {...buildErrorMessage(formik, id)}
                  />
                )
              }
            )}
        </div>
        <div className={formCssClasses('form__action')}>
          {cancel ? (
            <Button
              variant="contained"
              onClick={formik.resetForm}
              disabled={!formik.dirty}
            >
              {cancel.label}
            </Button>
          ) : null}

          <Button
            variant="contained"
            color="primary"
            type="submit"
            disabled={!(formik.isValid && formik.dirty)}
          >
            {submit.label}
          </Button>
        </div>
      </form>
      <DisplayFormikState {...formik} />
    </div>
  )
}

export default DynamicSignup
